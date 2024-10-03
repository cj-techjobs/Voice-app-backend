// models/Recording.js
const mongoose = require("mongoose");

const recordingSchema = new mongoose.Schema({
  filename: String,
  file: Object,
  duration: String,
  userId: String,
  pitchData: String,
});

const segmentSchema = new mongoose.Schema({
  name: String,
  startTime: Number,
  endTime: Number,
  recordingId: String,
  userId: String,
});

const userProgressSchema = new mongoose.Schema({
  userId: String,
  userPitchData: Array,        
  originalPitchData: Array,
  recordingId: String,
  totalEntries: Number,
  totalMatches: Number,
  accuracy: String,
});

const streakSchema = new mongoose.Schema({
  userId: String,
  currentStreak: Number,
  longestStreak: Number,
  lastPracticeDate: Date,
});

const achievementSchema = new mongoose.Schema({
  userId: String,
  title: String,
  description: String,
  achievedDate: Date,
});

const userSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  gender: String,
  countryCode: String,
  phoneNumber: String,
  age: Number,
});

const Segment = mongoose.model("Segment", segmentSchema);
const User = mongoose.model("User", userSchema);
const Recording = mongoose.model("Recording", recordingSchema);
const UserProgress = mongoose.model("UserProgress", userProgressSchema);
const Streak = mongoose.model("Streak", streakSchema);
const Achievement = mongoose.model("Achievement", achievementSchema);

module.exports = {
  Recording,
  Segment,
  UserProgress,
  Streak,
  Achievement,
  User,
};
