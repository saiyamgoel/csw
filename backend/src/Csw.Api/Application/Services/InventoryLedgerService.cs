using Csw.Api.Application.DTOs;
using Csw.Api.Domain.Entities;
using Csw.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Csw.Api.Application.Services;

public class InventoryLedgerService(AppDbContext db)
{
    private static readonly Dictionary<TransactionType, int> Signs = new()
    {
        [TransactionType.OpeningBalance]     = 1,
        [TransactionType.Receipt]            = 1,
        [TransactionType.Consumption]        = -1,
        [TransactionType.PositiveAdjustment] = 1,
        [TransactionType.NegativeAdjustment] = -1,
    };

    private static string TypeLabel(TransactionType t) => t switch
    {
        TransactionType.OpeningBalance     => "Opening Balance",
        TransactionType.Receipt            => "Receipt",
        TransactionType.Consumption        => "Consumption",
        TransactionType.PositiveAdjustment => "Positive Adjustment",
        TransactionType.NegativeAdjustment => "Negative Adjustment",
        _ => t.ToString()
    };

    private async Task<InventoryTransactionDto> PostAsync(
        TransactionType type, Guid itemId, decimal quantity,
        string? reference, string? notes, DateTime transactionDate, Guid postedBy)
    {
        if (quantity <= 0)
            throw new InvalidOperationException("Quantity must be positive.");

        var item = await db.Items.Include(i => i.Unit).FirstOrDefaultAsync(i => i.Id == itemId)
            ?? throw new InvalidOperationException("Item not found.");

        // Prevent negative balance for outgoing types
        int sign = Signs[type];
        if (sign < 0)
        {
            var balance = await db.InventoryBalances.FindAsync(itemId);
            decimal current = balance?.QuantityOnHand ?? 0;
            if (current < quantity)
                throw new InvalidOperationException(
                    $"Insufficient stock. Available: {current} {item.Unit.Abbreviation}, requested: {quantity}.");
        }

        var tx = new InventoryTransaction
        {
            ItemId = itemId,
            TransactionType = type,
            Quantity = quantity,
            Sign = sign,
            Reference = reference?.Trim(),
            Notes = notes?.Trim(),
            TransactionDate = transactionDate.Date,
            PostedAt = DateTime.UtcNow,
            PostedByUserId = postedBy
        };
        db.InventoryTransactions.Add(tx);

        // Update balance
        var bal = await db.InventoryBalances.FindAsync(itemId);
        if (bal == null)
        {
            bal = new InventoryBalance { ItemId = itemId, QuantityOnHand = quantity * sign };
            db.InventoryBalances.Add(bal);
        }
        else
        {
            bal.QuantityOnHand += quantity * sign;
            bal.LastUpdatedAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync();

        var poster = await db.Users.FindAsync(postedBy);
        return ToDto(tx, item, poster?.FullName ?? "System");
    }

    public Task<InventoryTransactionDto> PostReceiptAsync(PostReceiptRequest req, Guid userId) =>
        PostAsync(TransactionType.Receipt, req.ItemId, req.Quantity, req.Reference, req.Notes, req.TransactionDate, userId);

    public Task<InventoryTransactionDto> PostConsumptionAsync(PostConsumptionRequest req, Guid userId) =>
        PostAsync(TransactionType.Consumption, req.ItemId, req.Quantity, req.Reference, req.Notes, req.TransactionDate, userId);

    public async Task<InventoryTransactionDto> PostAdjustmentAsync(PostAdjustmentRequest req, Guid userId)
    {
        var type = req.IsPositive ? TransactionType.PositiveAdjustment : TransactionType.NegativeAdjustment;
        return await PostAsync(type, req.ItemId, req.Quantity, req.Reference, req.Notes, req.TransactionDate, userId);
    }

    public async Task<InventoryTransactionDto> PostOpeningBalanceAsync(PostOpeningBalanceRequest req, Guid userId)
    {
        // Only one opening balance per item
        bool exists = await db.InventoryTransactions
            .AnyAsync(t => t.ItemId == req.ItemId && t.TransactionType == TransactionType.OpeningBalance && !t.IsVoided);
        if (exists)
            throw new InvalidOperationException("An opening balance already exists for this item. Post an adjustment instead.");
        return await PostAsync(TransactionType.OpeningBalance, req.ItemId, req.Quantity, null, req.Notes, DateTime.UtcNow, userId);
    }

    public async Task<InventoryTransactionDto> VoidTransactionAsync(Guid txId, Guid userId)
    {
        var tx = await db.InventoryTransactions
            .Include(t => t.Item).ThenInclude(i => i.Unit)
            .FirstOrDefaultAsync(t => t.Id == txId)
            ?? throw new InvalidOperationException("Transaction not found.");

        if (tx.IsVoided)
            throw new InvalidOperationException("Transaction is already voided.");

        tx.IsVoided = true;

        // Create reversal
        var reversal = new InventoryTransaction
        {
            ItemId = tx.ItemId,
            TransactionType = tx.Sign > 0 ? TransactionType.NegativeAdjustment : TransactionType.PositiveAdjustment,
            Quantity = tx.Quantity,
            Sign = -tx.Sign,
            Reference = $"VOID:{tx.Id}",
            Notes = $"Reversal of transaction {tx.Id}",
            TransactionDate = DateTime.UtcNow.Date,
            PostedAt = DateTime.UtcNow,
            PostedByUserId = userId
        };
        db.InventoryTransactions.Add(reversal);

        // Update balance
        var bal = await db.InventoryBalances.FindAsync(tx.ItemId)
            ?? throw new InvalidOperationException("Balance record not found.");
        bal.QuantityOnHand += tx.Quantity * (-tx.Sign);
        bal.LastUpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();

        var poster = await db.Users.FindAsync(userId);
        return ToDto(reversal, tx.Item, poster?.FullName ?? "System");
    }

    public async Task<PagedResult<InventoryTransactionDto>> GetLedgerAsync(LedgerQueryParams p)
    {
        var q = db.InventoryTransactions
            .Include(t => t.Item).ThenInclude(i => i.Unit)
            .AsQueryable();

        if (p.ItemId.HasValue) q = q.Where(t => t.ItemId == p.ItemId.Value);
        if (!string.IsNullOrWhiteSpace(p.TransactionType))
        {
            if (Enum.TryParse<TransactionType>(p.TransactionType, true, out var tt))
                q = q.Where(t => t.TransactionType == tt);
        }
        if (p.From.HasValue) q = q.Where(t => t.TransactionDate >= p.From.Value.Date);
        if (p.To.HasValue) q = q.Where(t => t.TransactionDate <= p.To.Value.Date);

        var total = await q.CountAsync();
        var txs = await q.OrderByDescending(t => t.PostedAt)
            .Skip((p.Page - 1) * p.PageSize).Take(p.PageSize)
            .ToListAsync();

        // Load posters
        var posterIds = txs.Select(t => t.PostedByUserId).Where(id => id.HasValue).Select(id => id!.Value).Distinct().ToList();
        var posters = await db.Users.Where(u => posterIds.Contains(u.Id)).ToDictionaryAsync(u => u.Id, u => u.FullName);

        return new PagedResult<InventoryTransactionDto>(
            txs.Select(t => ToDto(t, t.Item, t.PostedByUserId.HasValue && posters.TryGetValue(t.PostedByUserId.Value, out var name) ? name : "System")).ToList(),
            total, p.Page, p.PageSize);
    }

    public async Task<List<InventoryBalanceDto>> GetAllBalancesAsync(bool? lowStockOnly)
    {
        var q = db.Items
            .Include(i => i.Unit)
            .Include(i => i.Balance)
            .Where(i => i.IsActive)
            .AsQueryable();

        if (lowStockOnly == true)
            q = q.Where(i => i.Balance != null && i.Balance.QuantityOnHand <= i.MinimumStockLevel);

        var items = await q.OrderBy(i => i.Code).ToListAsync();
        return items.Select(i => new InventoryBalanceDto(
            i.Id, i.Code, i.Name,
            i.Category == ItemCategory.RawMaterial ? "RAW_MATERIAL"
                : i.Category == ItemCategory.Accessory ? "ACCESSORY" : "PACKAGING",
            i.Unit.Name, i.Unit.Abbreviation,
            i.Balance?.QuantityOnHand ?? 0,
            i.Balance?.QuantityReserved ?? 0,
            (i.Balance?.QuantityOnHand ?? 0) - (i.Balance?.QuantityReserved ?? 0),
            GetStockStatus(i),
            i.MinimumStockLevel, i.ReorderLevel
        )).ToList();
    }

    private static string GetStockStatus(Item item)
    {
        var qty = item.Balance?.QuantityOnHand ?? 0;
        if (qty <= 0) return "OUT_OF_STOCK";
        if (qty <= item.MinimumStockLevel) return "LOW_STOCK";
        return "IN_STOCK";
    }

    private static InventoryTransactionDto ToDto(InventoryTransaction t, Item item, string posterName) => new(
        t.Id, t.ItemId, item.Code, item.Name,
        TypeLabel(t.TransactionType),
        t.Quantity, t.Sign, t.Reference, t.Notes,
        t.TransactionDate, t.PostedAt, posterName, t.IsVoided, null
    );
}
