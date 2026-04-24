const requiredEnvVars = [
  'JWT_SECRET',
  'MONGODB_URI'
];

const optionalEnvVars = [
  'PORT',
  'STRIPE_SECRET_KEY',
  'CLIENT_URL'
];

function validateEnvironment() {
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(envVar => console.error(`   - ${envVar}`));
    console.error('\nPlease set these environment variables and restart the server.');
    process.exit(1);
  }

  // Validate JWT secret is not empty
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error('❌ JWT_SECRET must be at least 32 characters long for security');
    process.exit(1);
  }

  // Validate MongoDB URI format
  try {
    new URL(process.env.MONGODB_URI);
  } catch (error) {
    console.error('❌ MONGODB_URI must be a valid MongoDB connection string');
    process.exit(1);
  }

  // Set defaults for optional variables
  process.env.PORT = process.env.PORT || '5000';
  process.env.CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

  console.log('✅ Environment variables validated successfully');
  
  // Log configuration (without sensitive data)
  console.log('📋 Server Configuration:');
  console.log(`   - Port: ${process.env.PORT}`);
  console.log(`   - MongoDB: ${process.env.MONGODB_URI ? '✓ Connected' : '✗ Not configured'}`);
  console.log(`   - Stripe: ${process.env.STRIPE_SECRET_KEY ? '✓ Configured' : '✗ Not configured'}`);
  console.log(`   - Client URL: ${process.env.CLIENT_URL}`);
}

module.exports = { validateEnvironment };
