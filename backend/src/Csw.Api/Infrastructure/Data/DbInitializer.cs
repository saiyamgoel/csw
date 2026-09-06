using Csw.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Csw.Api.Infrastructure.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(AppDbContext db)
    {
        // Roles
        if (!await db.Roles.AnyAsync())
        {
            var roles = new[]
            {
                new Role { Id = Guid.Parse("10000000-0000-0000-0000-000000000001"), Name = "Administrator", Description = "Full system access" },
                new Role { Id = Guid.Parse("10000000-0000-0000-0000-000000000002"), Name = "InventoryUser", Description = "Inventory receipts and adjustments" },
                new Role { Id = Guid.Parse("10000000-0000-0000-0000-000000000003"), Name = "ProductionUser", Description = "BOM and production consumption" },
                new Role { Id = Guid.Parse("10000000-0000-0000-0000-000000000004"), Name = "ManagementUser", Description = "Read-only dashboards and reports" },
            };
            db.Roles.AddRange(roles);
            await db.SaveChangesAsync();
        }

        // Users
        if (!await db.Users.AnyAsync())
        {
            var adminRole = await db.Roles.FirstAsync(r => r.Name == "Administrator");
            var invRole = await db.Roles.FirstAsync(r => r.Name == "InventoryUser");

            var admin = new User
            {
                Id = Guid.Parse("20000000-0000-0000-0000-000000000001"),
                Email = "admin@csw.local",
                FullName = "System Administrator",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                IsActive = true
            };
            var invUser = new User
            {
                Id = Guid.Parse("20000000-0000-0000-0000-000000000002"),
                Email = "inventory@csw.local",
                FullName = "Inventory Manager",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Inventory@123"),
                IsActive = true
            };
            db.Users.AddRange(admin, invUser);
            await db.SaveChangesAsync();

            db.UserRoles.AddRange(
                new UserRole { UserId = admin.Id, RoleId = adminRole.Id },
                new UserRole { UserId = invUser.Id, RoleId = invRole.Id }
            );
            await db.SaveChangesAsync();
        }

        // Units
        if (!await db.Units.AnyAsync())
        {
            db.Units.AddRange(
                new Unit { Id = Guid.Parse("30000000-0000-0000-0000-000000000001"), Name = "Pieces", Abbreviation = "PCS" },
                new Unit { Id = Guid.Parse("30000000-0000-0000-0000-000000000002"), Name = "Kilograms", Abbreviation = "KG" },
                new Unit { Id = Guid.Parse("30000000-0000-0000-0000-000000000003"), Name = "Grams", Abbreviation = "GM" },
                new Unit { Id = Guid.Parse("30000000-0000-0000-0000-000000000004"), Name = "Metres", Abbreviation = "MTR" },
                new Unit { Id = Guid.Parse("30000000-0000-0000-0000-000000000005"), Name = "Sets", Abbreviation = "SET" },
                new Unit { Id = Guid.Parse("30000000-0000-0000-0000-000000000006"), Name = "Boxes", Abbreviation = "BOX" },
                new Unit { Id = Guid.Parse("30000000-0000-0000-0000-000000000007"), Name = "Cartons", Abbreviation = "CTN" }
            );
            await db.SaveChangesAsync();
        }

        // Product Types
        if (!await db.ProductTypes.AnyAsync())
        {
            db.ProductTypes.AddRange(
                new ProductType { Code = "SAUCE", Name = "Sauce Pan", Description = "Triply / SS Sauce Pan range" },
                new ProductType { Code = "KAD", Name = "Kadai", Description = "Kadai cooking vessel" },
                new ProductType { Code = "FRY", Name = "Fry Pan", Description = "Fry pan range" },
                new ProductType { Code = "CAS", Name = "Casserole", Description = "Casserole range" },
                new ProductType { Code = "TOPE", Name = "Tope", Description = "Tope cooking vessel" },
                new ProductType { Code = "LID", Name = "Lid", Description = "Steel / Glass lids" }
            );
            await db.SaveChangesAsync();
        }

        // Sample Items
        if (!await db.Items.AnyAsync())
        {
            var kgUnit = await db.Units.FirstAsync(u => u.Abbreviation == "KG");
            var pcsUnit = await db.Units.FirstAsync(u => u.Abbreviation == "PCS");
            var ctnUnit = await db.Units.FirstAsync(u => u.Abbreviation == "CTN");

            var items = new List<Item>
            {
                new Item { Code = "TRI-MAT-001", Name = "Triply Material (3-ply sheet)", Category = ItemCategory.RawMaterial, UnitId = kgUnit.Id, MinimumStockLevel = 100, ReorderLevel = 200, PreferredStockLevel = 500 },
                new Item { Code = "SS-CIR-001", Name = "SS Circles 3ply 26cm", Category = ItemCategory.RawMaterial, UnitId = kgUnit.Id, MinimumStockLevel = 50, ReorderLevel = 100, PreferredStockLevel = 300 },
                new Item { Code = "SS-SHT-001", Name = "Stainless Steel Sheet", Category = ItemCategory.RawMaterial, UnitId = kgUnit.Id, MinimumStockLevel = 50, ReorderLevel = 100, PreferredStockLevel = 300 },
                new Item { Code = "ACC-DCH7", Name = "Die Cast Long Handle 7 inch", Category = ItemCategory.Accessory, UnitId = pcsUnit.Id, MinimumStockLevel = 50, ReorderLevel = 100, PreferredStockLevel = 300 },
                new Item { Code = "ACC-MWH", Name = "Medium Wire Handle", Category = ItemCategory.Accessory, UnitId = pcsUnit.Id, MinimumStockLevel = 50, ReorderLevel = 100, PreferredStockLevel = 300 },
                new Item { Code = "ACC-SSK", Name = "Stainless Steel Knob", Category = ItemCategory.Accessory, UnitId = pcsUnit.Id, MinimumStockLevel = 100, ReorderLevel = 200, PreferredStockLevel = 500 },
                new Item { Code = "PKG-CB20", Name = "Colour Box 20cm", Category = ItemCategory.Packaging, UnitId = pcsUnit.Id, MinimumStockLevel = 50, ReorderLevel = 100, PreferredStockLevel = 300 },
                new Item { Code = "PKG-CB24", Name = "Colour Box 24cm", Category = ItemCategory.Packaging, UnitId = pcsUnit.Id, MinimumStockLevel = 50, ReorderLevel = 100, PreferredStockLevel = 300 },
                new Item { Code = "PKG-CTN", Name = "Master Carton", Category = ItemCategory.Packaging, UnitId = ctnUnit.Id, MinimumStockLevel = 10, ReorderLevel = 20, PreferredStockLevel = 100 },
            };
            db.Items.AddRange(items);
            await db.SaveChangesAsync();

            // Seed opening balances
            var balances = new List<InventoryBalance>
            {
                new InventoryBalance { ItemId = items[0].Id, QuantityOnHand = 480 },
                new InventoryBalance { ItemId = items[1].Id, QuantityOnHand = 75 },  // low stock
                new InventoryBalance { ItemId = items[2].Id, QuantityOnHand = 0 },   // out of stock
                new InventoryBalance { ItemId = items[3].Id, QuantityOnHand = 150 },
                new InventoryBalance { ItemId = items[4].Id, QuantityOnHand = 280 },
                new InventoryBalance { ItemId = items[5].Id, QuantityOnHand = 420 },
                new InventoryBalance { ItemId = items[6].Id, QuantityOnHand = 160 },
                new InventoryBalance { ItemId = items[7].Id, QuantityOnHand = 40 },  // low stock
                new InventoryBalance { ItemId = items[8].Id, QuantityOnHand = 35 },
            };
            db.InventoryBalances.AddRange(balances);
            await db.SaveChangesAsync();
        }
    }
}
