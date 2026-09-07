using Csw.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Csw.Api.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<Unit> Units => Set<Unit>();
    public DbSet<Item> Items => Set<Item>();
    public DbSet<InventoryBalance> InventoryBalances => Set<InventoryBalance>();
    public DbSet<InventoryTransaction> InventoryTransactions => Set<InventoryTransaction>();
    public DbSet<ProductType> ProductTypes => Set<ProductType>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<AuditEvent> AuditEvents => Set<AuditEvent>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        // UserRole join table
        mb.Entity<UserRole>().HasKey(ur => new { ur.UserId, ur.RoleId });
        mb.Entity<UserRole>()
            .HasOne(ur => ur.User).WithMany(u => u.UserRoles).HasForeignKey(ur => ur.UserId);
        mb.Entity<UserRole>()
            .HasOne(ur => ur.Role).WithMany(r => r.UserRoles).HasForeignKey(ur => ur.RoleId);

        // User
        mb.Entity<User>().HasIndex(u => u.Email).IsUnique();

        // Role
        mb.Entity<Role>().HasIndex(r => r.Name).IsUnique();

        // Item
        mb.Entity<Item>().HasIndex(i => i.Code).IsUnique();
        mb.Entity<Item>().Property(i => i.Category).HasConversion<string>();
        mb.Entity<Item>()
            .HasOne(i => i.Balance).WithOne(b => b.Item)
            .HasForeignKey<InventoryBalance>(b => b.ItemId);
        mb.Entity<Item>()
            .HasOne(i => i.Unit).WithMany(u => u.Items).HasForeignKey(i => i.UnitId);
        mb.Entity<Item>()
            .HasMany(i => i.Suppliers).WithMany(s => s.Items)
            .UsingEntity(j => j.ToTable("item_suppliers"));

        // InventoryBalance
        mb.Entity<InventoryBalance>()
            .Ignore(b => b.QuantityAvailable);

        // InventoryTransaction
        mb.Entity<InventoryTransaction>().Property(t => t.TransactionType).HasConversion<string>();

        // ProductType
        mb.Entity<ProductType>().HasIndex(p => p.Code).IsUnique();

        // AuditEvent
        mb.Entity<AuditEvent>().HasKey(a => a.Id);
        mb.Entity<AuditEvent>().Property(a => a.Id).ValueGeneratedOnAdd();

        // Decimal precision
        foreach (var prop in mb.Model.GetEntityTypes()
            .SelectMany(e => e.GetProperties())
            .Where(p => p.ClrType == typeof(decimal) || p.ClrType == typeof(decimal?)))
        {
            prop.SetPrecision(18);
            prop.SetScale(4);
        }
    }
}
