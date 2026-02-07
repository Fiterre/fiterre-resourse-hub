import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

// Simple setup endpoint - use once then disable
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  
  // Simple setup key
  if (key !== "fiterre-setup-2024") {
    return NextResponse.json({ error: "Invalid key" }, { status: 401 });
  }

  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 500 });
    }
    
    const sql = neon(databaseUrl);

    // Create enums
    await sql`
      DO $$ BEGIN
        CREATE TYPE role AS ENUM ('user', 'admin');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    await sql`
      DO $$ BEGIN
        CREATE TYPE tier AS ENUM ('1', '2', '3', '4', '5');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    await sql`
      DO $$ BEGIN
        CREATE TYPE action AS ENUM ('view', 'create', 'edit', 'delete');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    await sql`
      DO $$ BEGIN
        CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT,
        email VARCHAR(320) UNIQUE,
        email_verified TIMESTAMP,
        image TEXT,
        hashed_password TEXT,
        role role DEFAULT 'user' NOT NULL,
        tier tier DEFAULT '5' NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        last_signed_in TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;

    // Create sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        session_token TEXT NOT NULL UNIQUE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires TIMESTAMP NOT NULL
      );
    `;

    // Create accounts table
    await sql`
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        provider TEXT NOT NULL,
        provider_account_id TEXT NOT NULL,
        refresh_token TEXT,
        access_token TEXT,
        expires_at INTEGER,
        token_type TEXT,
        scope TEXT,
        id_token TEXT,
        session_state TEXT
      );
    `;

    // Create verification_tokens table
    await sql`
      CREATE TABLE IF NOT EXISTS verification_tokens (
        identifier TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires TIMESTAMP NOT NULL
      );
    `;

    // Create resources table
    await sql`
      CREATE TABLE IF NOT EXISTS resources (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        url VARCHAR(2048) NOT NULL,
        category VARCHAR(64) NOT NULL,
        icon VARCHAR(64),
        labels TEXT,
        required_tier tier,
        is_external BOOLEAN DEFAULT true,
        is_favorite BOOLEAN DEFAULT false,
        sort_order INTEGER DEFAULT 0,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;

    // Create categories table
    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(128) NOT NULL,
        icon VARCHAR(64),
        color VARCHAR(32),
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;

    // Create labels table
    await sql`
      CREATE TABLE IF NOT EXISTS labels (
        id SERIAL PRIMARY KEY,
        name VARCHAR(128) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;

    // Create access_logs table
    await sql`
      CREATE TABLE IF NOT EXISTS access_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        user_name VARCHAR(255),
        resource_id INTEGER REFERENCES resources(id),
        resource_title VARCHAR(255),
        resource_url VARCHAR(2048),
        action action NOT NULL,
        timestamp TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;

    // Create invitations table
    await sql`
      CREATE TABLE IF NOT EXISTS invitations (
        id SERIAL PRIMARY KEY,
        token VARCHAR(64) NOT NULL UNIQUE,
        email VARCHAR(320),
        initial_tier tier DEFAULT '5' NOT NULL,
        status invitation_status DEFAULT 'pending' NOT NULL,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used_at TIMESTAMP,
        used_by INTEGER REFERENCES users(id)
      );
    `;

    // Create allowed_domains table
    await sql`
      CREATE TABLE IF NOT EXISTS allowed_domains (
        id SERIAL PRIMARY KEY,
        domain VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;

    // Create settings table
    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(128) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;

    // Create default admin user (password: admin123)
    const adminPassword = "admin123";
    const adminHash = await bcrypt.hash(adminPassword, 12);
    
    // Delete existing admin to reset password
    await sql`DELETE FROM users WHERE email = 'admin@fiterre.com'`;
    
    await sql`
      INSERT INTO users (name, email, hashed_password, role, tier)
      VALUES ('Admin', 'admin@fiterre.com', ${adminHash}, 'admin', '1')
    `;

    return NextResponse.json({ 
      success: true, 
      message: "Database initialized successfully!",
      admin: {
        email: "admin@fiterre.com",
        password: "admin123"
      }
    });
  } catch (error) {
    console.error("Database setup error:", error);
    return NextResponse.json(
      { error: "Database setup failed", details: String(error) },
      { status: 500 }
    );
  }
}
