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

        // Characteristic Types & Values
        if (!await db.CharacteristicTypes.AnyAsync())
        {
            var ptId = Guid.Parse("50000000-0000-0000-0000-000000000001");
            var matId = Guid.Parse("50000000-0000-0000-0000-000000000002");
            var sizeId = Guid.Parse("50000000-0000-0000-0000-000000000003");
            var handleId = Guid.Parse("50000000-0000-0000-0000-000000000004");
            var finishId = Guid.Parse("50000000-0000-0000-0000-000000000005");
            var lidId = Guid.Parse("50000000-0000-0000-0000-000000000006");

            var ctypes = new[]
            {
                new CharacteristicType { Id = ptId, Code = "PRODUCT_TYPE", Name = "Product Type", SortOrder = 1 },
                new CharacteristicType { Id = matId, Code = "MATERIAL", Name = "Material", SortOrder = 2 },
                new CharacteristicType { Id = sizeId, Code = "SIZE", Name = "Size (cm)", SortOrder = 3 },
                new CharacteristicType { Id = handleId, Code = "HANDLE_TYPE", Name = "Handle Type", SortOrder = 4 },
                new CharacteristicType { Id = finishId, Code = "FINISH", Name = "Finish", SortOrder = 5 },
                new CharacteristicType { Id = lidId, Code = "LID_TYPE", Name = "Lid Type", SortOrder = 6, Description = "Optional" },
            };
            db.CharacteristicTypes.AddRange(ctypes);
            await db.SaveChangesAsync();

            db.CharacteristicValues.AddRange(
                // Product Types
                new CharacteristicValue { CharacteristicTypeId = ptId, Code = "SAUCE", Name = "Sauce Pan", SortOrder = 1 },
                new CharacteristicValue { CharacteristicTypeId = ptId, Code = "KAD", Name = "Kadai", SortOrder = 2 },
                new CharacteristicValue { CharacteristicTypeId = ptId, Code = "FRY", Name = "Fry Pan", SortOrder = 3 },
                new CharacteristicValue { CharacteristicTypeId = ptId, Code = "CAS", Name = "Casserole", SortOrder = 4 },
                new CharacteristicValue { CharacteristicTypeId = ptId, Code = "TOPE", Name = "Tope", SortOrder = 5 },
                // Materials
                new CharacteristicValue { CharacteristicTypeId = matId, Code = "TRI", Name = "Triply", SortOrder = 1 },
                new CharacteristicValue { CharacteristicTypeId = matId, Code = "SS", Name = "Stainless Steel", SortOrder = 2 },
                new CharacteristicValue { CharacteristicTypeId = matId, Code = "ALU", Name = "Aluminium", SortOrder = 3 },
                // Sizes
                new CharacteristicValue { CharacteristicTypeId = sizeId, Code = "14", Name = "14 cm", SortOrder = 1 },
                new CharacteristicValue { CharacteristicTypeId = sizeId, Code = "16", Name = "16 cm", SortOrder = 2 },
                new CharacteristicValue { CharacteristicTypeId = sizeId, Code = "18", Name = "18 cm", SortOrder = 3 },
                new CharacteristicValue { CharacteristicTypeId = sizeId, Code = "20", Name = "20 cm", SortOrder = 4 },
                new CharacteristicValue { CharacteristicTypeId = sizeId, Code = "22", Name = "22 cm", SortOrder = 5 },
                new CharacteristicValue { CharacteristicTypeId = sizeId, Code = "24", Name = "24 cm", SortOrder = 6 },
                new CharacteristicValue { CharacteristicTypeId = sizeId, Code = "26", Name = "26 cm", SortOrder = 7 },
                new CharacteristicValue { CharacteristicTypeId = sizeId, Code = "28", Name = "28 cm", SortOrder = 8 },
                // Handle Types
                new CharacteristicValue { CharacteristicTypeId = handleId, Code = "DCL7", Name = "Die Cast Long 7\"", SortOrder = 1 },
                new CharacteristicValue { CharacteristicTypeId = handleId, Code = "MWH", Name = "Medium Wire Handle", SortOrder = 2 },
                new CharacteristicValue { CharacteristicTypeId = handleId, Code = "SSH", Name = "SS Handle", SortOrder = 3 },
                new CharacteristicValue { CharacteristicTypeId = handleId, Code = "DH2", Name = "Double Handle", SortOrder = 4 },
                // Finish
                new CharacteristicValue { CharacteristicTypeId = finishId, Code = "MIR", Name = "Mirror Polish", SortOrder = 1 },
                new CharacteristicValue { CharacteristicTypeId = finishId, Code = "MAT", Name = "Matt Finish", SortOrder = 2 },
                new CharacteristicValue { CharacteristicTypeId = finishId, Code = "BLK", Name = "Black Coated", SortOrder = 3 },
                // Lid Types
                new CharacteristicValue { CharacteristicTypeId = lidId, Code = "BC", Name = "Black Cool Lid", SortOrder = 1 },
                new CharacteristicValue { CharacteristicTypeId = lidId, Code = "GL", Name = "Glass Lid", SortOrder = 2 },
                new CharacteristicValue { CharacteristicTypeId = lidId, Code = "SSL", Name = "SS Lid", SortOrder = 3 },
                new CharacteristicValue { CharacteristicTypeId = lidId, Code = "NL", Name = "No Lid", SortOrder = 4 }
            );
            await db.SaveChangesAsync();

            // Code Masters + Rules
            var cmPt = new CodeMaster { Id = Guid.Parse("60000000-0000-0000-0000-000000000001"), SegmentName = "ProductType", SegmentOrder = 1, Separator = "" };
            var cmMat = new CodeMaster { Id = Guid.Parse("60000000-0000-0000-0000-000000000002"), SegmentName = "Material", SegmentOrder = 2, Separator = "-" };
            var cmSz = new CodeMaster { Id = Guid.Parse("60000000-0000-0000-0000-000000000003"), SegmentName = "Size", SegmentOrder = 3, Separator = "-" };
            var cmHdl = new CodeMaster { Id = Guid.Parse("60000000-0000-0000-0000-000000000004"), SegmentName = "HandleType", SegmentOrder = 4, Separator = "-" };
            var cmFin = new CodeMaster { Id = Guid.Parse("60000000-0000-0000-0000-000000000005"), SegmentName = "Finish", SegmentOrder = 5, Separator = "-" };
            var cmLid = new CodeMaster { Id = Guid.Parse("60000000-0000-0000-0000-000000000006"), SegmentName = "LidType", SegmentOrder = 6, Separator = "-", IsOptional = true };
            db.CodeMasters.AddRange(cmPt, cmMat, cmSz, cmHdl, cmFin, cmLid);
            await db.SaveChangesAsync();

            db.CodeGenerationRules.AddRange(
                new CodeGenerationRule { CodeMasterId = cmPt.Id, CharacteristicTypeId = ptId },
                new CodeGenerationRule { CodeMasterId = cmMat.Id, CharacteristicTypeId = matId },
                new CodeGenerationRule { CodeMasterId = cmSz.Id, CharacteristicTypeId = sizeId },
                new CodeGenerationRule { CodeMasterId = cmHdl.Id, CharacteristicTypeId = handleId },
                new CodeGenerationRule { CodeMasterId = cmFin.Id, CharacteristicTypeId = finishId },
                new CodeGenerationRule { CodeMasterId = cmLid.Id, CharacteristicTypeId = lidId }
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
