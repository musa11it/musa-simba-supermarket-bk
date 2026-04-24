import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB } from '../config/database';
import User from '../models/User';
import Branch from '../models/Branch';
import Category from '../models/Category';
import Product from '../models/Product';
import Inventory from '../models/Inventory';
import { branchesData, categoriesData, productsData } from '../data/seedData';

const seed = async (): Promise<void> => {
  try {
    await connectDB();
    console.log('🌱 Seeding database...\n');

    // Clear existing data (except users we want to keep — we'll handle users separately)
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      Branch.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Inventory.deleteMany({}),
    ]);

    // Create Super Admin
    const superAdminEmail = process.env.SUPERADMIN_EMAIL || 'superadmin@simba.rw';
    const superAdminPassword = process.env.SUPERADMIN_PASSWORD || 'Simba@2026';

    let superadmin = await User.findOne({ email: superAdminEmail });
    if (!superadmin) {
      superadmin = await User.create({
        name: 'Super Admin',
        email: superAdminEmail,
        password: superAdminPassword,
        role: 'superadmin',
        phone: '+250 788 000 000',
      });
      console.log(`✅ Super admin created: ${superAdminEmail}`);
    } else {
      console.log(`✓  Super admin already exists: ${superAdminEmail}`);
    }

    // Seed branches
    console.log('🏢 Creating branches...');
    const branches = await Branch.insertMany(
      branchesData.map((b) => ({
        ...b,
        pendingApproval: false,
        approvedBy: superadmin!._id,
      }))
    );
    console.log(`✅ ${branches.length} branches created\n`);

    // Seed categories
    console.log('🏷️  Creating categories...');
    const categories = await Category.insertMany(categoriesData);
    console.log(`✅ ${categories.length} categories created\n`);

    const categoryMap = new Map(categories.map((c: any) => [c.slug, c._id]));

    // Seed products
    console.log('📦 Creating products...');
    const productDocs = productsData.map((p) => ({
      name: p.name,
      nameRw: p.nameRw,
      nameFr: p.nameFr,
      description: `High-quality ${p.name} available at Simba Supermarket. Sourced fresh daily.`,
      descriptionRw: `${p.nameRw} y'umwimerere muri Simba Supermarket.`,
      descriptionFr: `${p.nameFr} de haute qualité chez Simba Supermarché.`,
      categoryId: categoryMap.get(p.categorySlug),
      price: p.price,
      unit: p.unit,
      image: p.image,
      tags: p.tags,
      brand: p.brand || 'Simba',
      isFeatured: p.featured || false,
    }));

    const products = await Product.insertMany(productDocs);
    console.log(`✅ ${products.length} products created\n`);

    // Seed inventory for each product at each branch
    console.log('📊 Creating inventory...');
    const inventoryDocs: any[] = [];
    for (const branch of branches) {
      for (const product of products) {
        inventoryDocs.push({
          productId: product._id,
          branchId: branch._id,
          stock: Math.floor(Math.random() * 80) + 20,
          lowStockThreshold: 10,
        });
      }
    }
    await Inventory.insertMany(inventoryDocs);
    console.log(`✅ ${inventoryDocs.length} inventory records created\n`);

    // Create demo admin for first branch
    const demoAdminEmail = 'admin.remera@simba.rw';
    let demoAdmin = await User.findOne({ email: demoAdminEmail });
    if (!demoAdmin) {
      const remeraBranch = branches.find((b) => b.name.includes('Remera'));
      demoAdmin = await User.create({
        name: 'Remera Branch Admin',
        email: demoAdminEmail,
        password: 'Admin@2026',
        role: 'admin',
        branchId: remeraBranch?._id,
        phone: '+250 788 100 002',
      });
      if (remeraBranch) {
        remeraBranch.managerIds.push(demoAdmin._id as any);
        await remeraBranch.save();
      }
      console.log(`✅ Demo admin created: ${demoAdminEmail} / Admin@2026`);
    }

    // Create demo staff
    const demoStaffEmail = 'staff.remera@simba.rw';
    let demoStaff = await User.findOne({ email: demoStaffEmail });
    if (!demoStaff) {
      const remeraBranch = branches.find((b) => b.name.includes('Remera'));
      demoStaff = await User.create({
        name: 'Remera Staff Member',
        email: demoStaffEmail,
        password: 'Staff@2026',
        role: 'staff',
        branchId: remeraBranch?._id,
      });
      console.log(`✅ Demo staff created: ${demoStaffEmail} / Staff@2026`);
    }

    // Create demo customer
    const demoCustomerEmail = 'customer@simba.rw';
    let demoCustomer = await User.findOne({ email: demoCustomerEmail });
    if (!demoCustomer) {
      demoCustomer = await User.create({
        name: 'Jean Mukamana',
        email: demoCustomerEmail,
        password: 'Customer@2026',
        role: 'customer',
        phone: '+250 788 999 999',
      });
      console.log(`✅ Demo customer created: ${demoCustomerEmail} / Customer@2026`);
    }

    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║         🎉 SEED COMPLETE                   ║');
    console.log('╠════════════════════════════════════════════╣');
    console.log('║  Login Credentials (Demo):                 ║');
    console.log('║                                            ║');
    console.log(`║  Super Admin:                              ║`);
    console.log(`║    ${superAdminEmail.padEnd(34)}  ║`);
    console.log(`║    ${superAdminPassword.padEnd(34)}  ║`);
    console.log('║                                            ║');
    console.log('║  Admin:                                    ║');
    console.log('║    admin.remera@simba.rw                   ║');
    console.log('║    Admin@2026                              ║');
    console.log('║                                            ║');
    console.log('║  Staff:                                    ║');
    console.log('║    staff.remera@simba.rw                   ║');
    console.log('║    Staff@2026                              ║');
    console.log('║                                            ║');
    console.log('║  Customer:                                 ║');
    console.log('║    customer@simba.rw                       ║');
    console.log('║    Customer@2026                           ║');
    console.log('╚════════════════════════════════════════════╝\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seed();
