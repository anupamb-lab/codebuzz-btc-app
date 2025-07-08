const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Connect to MongoDB
mongoose.connect('mongodb+srv://growthdev1:Ji0LlqjCuFzlYP9s@cluster0.zgxt7d9.mongodb.net/fakeminingapp?retryWrites=true&w=majority&appName=Cluster0');

// User Schema (simplified)
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  isActive: { type: Boolean, default: true },
  lastLogin: Date
}, { timestamps: true });

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Password comparison method
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Reset token generation
userSchema.methods.getResetPasswordToken = function() {
  const resetToken = crypto.randomBytes(20).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken;
};

const User = mongoose.model('User', userSchema);

async function testPasswordReset() {
  try {
    console.log('🔍 Testing Password Reset Flow...\n');

    // Step 1: Find or create test user
    let user = await User.findOne({ email: 'test@example.com' });
    if (!user) {
      console.log('📝 Creating test user...');
      user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'oldpassword123'
      });
      console.log('✅ Test user created');
    } else {
      console.log('👤 Found existing test user');
    }

    // Step 2: Test login with old password
    console.log('\n🔐 Testing login with old password...');
    const oldPasswordMatch = await user.matchPassword('oldpassword123');
    console.log(`Old password match: ${oldPasswordMatch}`);

    // Step 3: Generate reset token
    console.log('\n🎫 Generating reset token...');
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });
    console.log(`Reset token: ${resetToken}`);
    console.log(`Hashed token: ${user.resetPasswordToken}`);

    // Step 4: Simulate password reset
    console.log('\n🔄 Simulating password reset...');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    const userToReset = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!userToReset) {
      console.log('❌ Reset token not found or expired');
      return;
    }

    console.log('✅ Reset token validated');

    // Step 5: Update password
    console.log('\n🔑 Updating password...');
    userToReset.password = 'newpassword123';
    userToReset.resetPasswordToken = undefined;
    userToReset.resetPasswordExpire = undefined;
    await userToReset.save();
    console.log('✅ Password updated');

    // Step 6: Test login with new password
    console.log('\n🔐 Testing login with new password...');
    const updatedUser = await User.findOne({ email: 'test@example.com' });
    const newPasswordMatch = await updatedUser.matchPassword('newpassword123');
    console.log(`New password match: ${newPasswordMatch}`);

    // Step 7: Test login with old password (should fail)
    console.log('\n🔐 Testing login with old password (should fail)...');
    const oldPasswordStillWorks = await updatedUser.matchPassword('oldpassword123');
    console.log(`Old password still works: ${oldPasswordStillWorks}`);

    if (newPasswordMatch && !oldPasswordStillWorks) {
      console.log('\n🎉 PASSWORD RESET TEST PASSED! ✅');
    } else {
      console.log('\n❌ PASSWORD RESET TEST FAILED!');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

testPasswordReset();
