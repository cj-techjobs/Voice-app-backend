require("./db");
const express = require("express");
const multer = require("multer");
const {
  Recording,
  Segment,
  UserProgress,
  Streak,
  Achievement,
  User,
} = require("./models/Recording");
const dotenv = require("dotenv");
const fs = require("fs");

const path = require("path");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const PORT = process.env.PORT || 3000;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "./myAudio";

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, `${file.originalname}`);
  },
});

const uploadFileToLocalhost = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "audio/mpeg" || file.mimetype === "audio/mp3") {
      cb(null, true);
    } else {
      return cb(new Error("Invalid mime type, only MP3 files are allowed"));
    }
  },
});

/**
 * multipartform data :- file(song),fileName,duration,pitchData,userId
 */
app.post("/upload", uploadFileToLocalhost.single("file"), (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).send("No file uploaded.");
    }
    const inputFilePath = path.join(__dirname, "myAudio", req.file.filename);
    if (!fs.existsSync(inputFilePath)) {
      console.error("Input file does not exist:", inputFilePath);
      return;
    }
    const recording = new Recording({
      file: file,
      ...req.body,
    });
    recording.save().then((doc) => {
      res.send({ message: "File uploaded successfully" });
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Error uploading recordings" });
  }
});

/**
 * get list of recordings as per userId
 */
app.get("/recordings/:userId", async (req, res) => {
  try {
    const recordings = await Recording.find({
      userId: req.params.userId,
    }).exec();
    res.json(
      recordings.map((item) => {
        const pitchArray = JSON.parse(item.pitchData.replace(/\n/g, "").trim());
        return {
          ...item._doc,
          pitchData: pitchArray,
        };
      })
    );
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Error fetching recordings" });
  }
});

/**
 * get single recording data
 *
 */
app.get("/recording/:id", async (req, res) => {
  try {
    const recordings = await Recording.find({ _id: req.params.id }).exec();
    res.json(
      recordings.map((item) => {
        const pitchArray = JSON.parse(item.pitchData.replace(/\n/g, "").trim());
        return {
          ...item._doc,
          pitchData: pitchArray,
        };
      })
    );
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Error fetching recording" });
  }
});

/**
 * get single recording and give download option
 *
 */
app.get("/recording/:filename/download", (req, res) => {
  try {
    const filePath = path.join(__dirname, "myAudio", req.params.filename);
    console.log("filepath is :- ", filePath);

    if (fs.existsSync(filePath)) {
      res.download(filePath, req.params.filename);
    } else {
      res.status(404).send({ message: "File not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Error fetching recording" });
  }
});

/**
 * delete the recording by id
 */
app.delete("/recording/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedRecording = await Recording.findByIdAndDelete(id);
    if (!deletedRecording) {
      return res.status(404).json({ message: "Recording not found" });
    }
    res.status(200).json({ message: "Recording deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting recording", error });
  }
});

// Create user
/**
 * body :- fullName,email,countryCode,phoneNumber,gender,age
 */
app.post("/user/create", async (req, res) => {
  try {
    const user = new User({ ...req.body });
    user.save().then((doc) => {
      res.send({ message: "User created successfully" });
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating user", error });
  }
});

// Update User
/**
 * body : fullName,email,countryCode,phoneNumber,gender,age
 */
app.put("/user/update/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true }
    );
    res.send(user);
  } catch (error) {
    res.status(500).json({ message: "Error updating user", error });
  }
});

/**
 * delete the user by id
 */
app.delete("/user/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user", error });
  }
});

// Get user data
//param - id of user
app.get("/user/get/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne(
      { _id: id },
      { createdAt: 0, updatedAt: 0, __v: 0 }
    );
    const streak = await Streak.findOne(
      { userId: id },
      { userId: 0, createdAt: 0, updatedAt: 0, __v: 0, _id: 0 }
    );
    const achievements = await Achievement.find(
      { userId: id },
      { userId: 0, createdAt: 0, updatedAt: 0, __v: 0, _id: 0 }
    );
    res.send({ ...user.toObject(), streak, achievements });
  } catch (error) {
    res.status(500).json({ message: "Error getting user ", error });
  }
});

// Create Segment
/**
 * body :- name,startTime,endTime,recordingId,userId
 */
app.post("/segment", async (req, res) => {
  try {
    const segment = new Segment({ ...req.body });
    segment.save().then((doc) => {
      res.send({ message: "Segment uploaded successfully" });
    });
  } catch (error) {
    res.status(500).json({ message: "Error uploading segment", error });
  }
});

// Update Segment
/**
 * body : name,startTime,endTime
 */
app.put("/segment/:id", async (req, res) => {
  try {
    const segment = await Segment.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true }
    );
    res.send(segment);
  } catch (error) {
    res.status(500).json({ message: "Error updating segment", error });
  }
});

// Get all segments only listing
//param - id of recording
app.get("/segments/:userId/:recordingId", async (req, res) => {
  try {
    const { recordingId } = req.params;
    const segments = await Segment.find({ recordingId, userId });
    res.send(segments);
  } catch (error) {
    res.status(500).json({ message: "Error fetching segment", error });
  }
});

// Get segment with pitch details
//params :- id of segment
app.get("/segment/:id/details", async (req, res) => {
  try {
    const segment = await Segment.findById(req.params.id).exec();

    if (!segment) {
      return res.status(404).json({ message: "Segment not found" });
    }
    let recording = await Recording.find({ _id: segment.recordingId }).exec();

    if (!recording) {
      return res.status(404).json({ message: "Recording not found" });
    }

    recording = recording.map((item) => {
      const pitchArray = JSON.parse(item.pitchData.replace(/\n/g, "").trim());
      return {
        ...item._doc,
        pitchData: pitchArray,
      };
    });

    const filteredPitchData = recording[0].pitchData.filter(
      (pitch) =>
        pitch.time >= segment.startTime && pitch.time <= segment.endTime
    );

    const segmentWithPitchData = {
      ...segment.toObject(),
      pitchData: filteredPitchData,
    };
    res.json(segmentWithPitchData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching segment details", error });
  }
});

/**
 * delete the segment by id
 */
app.delete("/segment/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedSegment = await Segment.findByIdAndDelete(id);
    if (!deletedSegment) {
      return res.status(404).json({ message: "Segment not found" });
    }
    res.status(200).json({ message: "Segment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting segment", error });
  }
});

// API to match user pitch with original recording pitch and calculate accuracy
/**
 * body :- userId,userPitchData,recordingId
 */
app.post("/recording/comparePitch", async (req, res) => {
  try {
    const { recordingId, userPitchData } = req.body;

    // Fetch the recording related to the segment
    let recording = await Recording.find({ _id: recordingId }).exec();

    if (!recording) {
      return res.status(404).json({ message: "Recording not found" });
    }

    recording = recording.map((item) => {
      const pitchArray = JSON.parse(item.pitchData.replace(/\n/g, "").trim());
      return {
        ...item._doc,
        pitchData: pitchArray,
      };
    });

    // Filter original pitch data for the segment's start and end time
    const originalPitchData = recording[0].pitchData;

    // Calculate accuracy
    let totalMatches = 0;
    let totalEntries = Math.min(originalPitchData.length, userPitchData.length);

    for (let i = 0; i < totalEntries; i++) {
      const originalPitch = originalPitchData[i];
      const userPitch = userPitchData[i];

      // Define tolerance or matching logic here
      const tolerance = 3; // Adjust this value based on the sensitivity of pitch matching
      if (
        Math.abs(originalPitch.frequency - userPitch.frequency) <= tolerance
      ) {
        totalMatches++;
      }
    }

    const accuracy = (totalMatches / totalEntries) * 100;

    const userReport = new UserProgress({
      userId: req.body.userId,
      userPitchData: req.body.userPitchData,
      originalPitchData: originalPitchData,
      recordingId: recordingId,
      totalEntries,
      totalMatches,
      accuracy: accuracy.toFixed(2) + "%",
    });
    userReport.save().then(async (doc) => {
      const streak = await maintainStreak(req.body.userId);
      const { _id, __v, ...data } = doc.toObject();
      await maintainAchievements(req.body.userId, accuracy.toFixed(2), streak);
      const suggestions = await generatePersonalizedSuggestions(
        req.body.userId,
        accuracy.toFixed(2),
        streak,
        data.userPitchData,
        data.originalPitchData
      );
      res.send({ ...data, suggestions });
    });
  } catch (error) {
    res.status(500).json({ message: "Error comparing pitch data", error });
  }
});

// API to match user pitch with original segment pitch and calculate accuracy
/**
 * body :- userId,userPitchData,segmentId
 */
app.post("/segment/comparePitch", async (req, res) => {
  try {
    const { segmentId, userPitchData } = req.body;

    // Fetch the segment details by ID
    const segment = await Segment.findById(segmentId);
    if (!segment) {
      return res.status(404).json({ message: "Segment not found" });
    }

    // Fetch the recording related to the segment
    let recording = await Recording.find({ _id: segment.recordingId }).exec();

    if (!recording) {
      return res.status(404).json({ message: "Recording not found" });
    }

    recording = recording.map((item) => {
      const pitchArray = JSON.parse(item.pitchData.replace(/\n/g, "").trim());
      return {
        ...item._doc,
        pitchData: pitchArray,
      };
    });

    // Filter original pitch data for the segment's start and end time
    const originalPitchData = recording[0].pitchData.filter(
      (pitch) =>
        pitch.time >= segment.startTime && pitch.time <= segment.endTime
    );

    // Calculate accuracy
    let totalMatches = 0;
    let totalEntries = Math.min(originalPitchData.length, userPitchData.length);

    for (let i = 0; i < totalEntries; i++) {
      const originalPitch = originalPitchData[i];
      const userPitch = userPitchData[i];

      // Define tolerance or matching logic here
      const tolerance = 3; // Adjust this value based on the sensitivity of pitch matching
      if (
        Math.abs(originalPitch.frequency - userPitch.frequency) <= tolerance
      ) {
        totalMatches++;
      }
    }

    const accuracy = (totalMatches / totalEntries) * 100;

    const userReport = new UserProgress({
      userId: req.body.userId,
      userPitchData: req.body.userPitchData,
      originalPitchData: originalPitchData,
      recordingId: segmentId,
      totalEntries,
      totalMatches,
      accuracy: accuracy.toFixed(2) + "%",
    });
    userReport.save().then(async (doc) => {
      const streak = await maintainStreak(req.body.userId);
      const { _id, __v, ...data } = doc.toObject();
      await maintainAchievements(req.body.userId, accuracy.toFixed(2), streak);
      const suggestions = await generatePersonalizedSuggestions(
        req.body.userId,
        accuracy.toFixed(2),
        streak,
        data.userPitchData,
        data.originalPitchData
      );
      res.send({ ...data, suggestions });
    });
  } catch (error) {
    res.status(500).json({ message: "Error comparing pitch data", error });
  }
});

// Get all user history
//param - id of user
app.get("/userHistory/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const data = await UserProgress.find(
      { userId: id },
      { __v: 0 },
      { sort: { _id: -1 } }
    );
    res.send(data);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching user previous history", error });
  }
});

// Get all user achievements
//param - id of user
app.get("/userAchievements/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Achievement.find(
      { userId: id },
      { __v: 0 },
      { sort: { _id: -1 } }
    );
    res.send(data);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching user achievements", error });
  }
});

// Get all user streak data
//param - id of user
app.get("/userStreak/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Streak.findOne(
      { userId: id },
      { __v: 0 },
      { sort: { _id: -1 } }
    );
    res.send(data);
  } catch (error) {
    res.status(500).json({ message: "Error fteching user streak", error });
  }
});

async function maintainStreak(userId) {
  try {
    // Check if streak data exists for the user
    let streak = await Streak.findOne({ userId });

    // Today's date at midnight (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to midnight for comparison

    if (!streak) {
      // No streak data found, create a new streak record
      streak = new Streak({
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastPracticeDate: today,
      });
      await streak.save();
      console.log("New streak data created.");
      return streak;
    }

    // Last practice date at midnight (start of day)
    const lastPracticeDate = new Date(streak.lastPracticeDate);
    lastPracticeDate.setHours(0, 0, 0, 0); // Normalize to midnight

    if (lastPracticeDate.getTime() === today.getTime()) {
      // User has already practiced today, no streak increment
      console.log("User has already practiced today. No streak increment.");
    } else if (today.getTime() - lastPracticeDate.getTime() === 86400000) {
      // User practiced yesterday, increment the streak
      streak.currentStreak += 1;
      streak.lastPracticeDate = today; // Update last practice date

      // Update longest streak if current streak exceeds it
      if (streak.currentStreak > streak.longestStreak) {
        streak.longestStreak = streak.currentStreak;
      }
      await streak.save();
      console.log("Streak incremented.");
    } else {
      // More than one day gap, reset the streak
      streak.currentStreak = 1;
      streak.lastPracticeDate = today; // Update last practice date
      await streak.save();
      console.log("Streak reset due to inactivity.");
    }

    return streak;
  } catch (error) {
    console.error("Error maintaining streak:", error);
    throw new Error("Unable to maintain streak.");
  }
}

async function maintainAchievements(userId, accuracy, streak) {
  try {
    // Achievement for accuracy
    if (Number(accuracy) >= 90) {
      const accuracyAchievement = await Achievement.findOne({
        userId: userId,
        title: "Accuracy Master",
      });

      if (!accuracyAchievement) {
        const achievement = new Achievement({
          userId: userId,
          title: "Accuracy Master",
          description: "Achieved 90%+ accuracy in a song",
          achievedDate: new Date(),
        });
        await achievement.save();
        console.log("Accuracy Master achievement unlocked!");
      }
    }

    // Achievement for 7-day streak
    if (streak.currentStreak >= 7) {
      const streakAchievement = await Achievement.findOne({
        userId: userId,
        title: "7-Day Streak",
      });

      if (!streakAchievement) {
        const achievement = new Achievement({
          userId: userId,
          title: "7-Day Streak",
          description: "Practiced for 7 consecutive days",
          achievedDate: new Date(),
        });
        await achievement.save();
        console.log("7-Day Streak achievement unlocked!");
      }
    }

    // 30-day streak achievement
    if (streak.currentStreak >= 30) {
      const streak30Achievement = await Achievement.findOne({
        userId: userId,
        title: "30-Day Streak",
      });

      if (!streak30Achievement) {
        const achievement = new Achievement({
          userId: userId,
          title: "30-Day Streak",
          description: "Practiced for 30 consecutive days",
          achievedDate: new Date(),
        });
        await achievement.save();
        console.log("30-Day Streak achievement unlocked!");
      }
    }

    // Longest streak achievement
    if (streak.currentStreak > streak.longestStreak) {
      const longestStreakAchievement = await Achievement.findOne({
        userId: userId,
        title: "Longest Streak",
      });

      if (!longestStreakAchievement) {
        const achievement = new Achievement({
          userId: userId,
          title: "Longest Streak",
          description: `Reached your longest streak of ${streak.currentStreak} days`,
          achievedDate: new Date(),
        });
        await achievement.save();
        console.log("Longest Streak achievement unlocked!");
      }
    }
    // More achievements can be added similarly, e.g., practicing 100 songs, etc.
  } catch (error) {
    console.error("Error maintaining achievements: ", error);
  }
}

async function generatePersonalizedSuggestions(
  userId,
  accuracy,
  streak,
  userPitchData,
  originalPitchData
) {
  let suggestions = [];

  try {
    // Low accuracy suggestion
    if (Number(accuracy) < 70) {
      suggestions.push(
        "Your accuracy is below 70%. Focus on practicing the difficult parts of the song to improve."
      );
    } else if (Number(accuracy) >= 70 && Number(accuracy) < 90) {
      suggestions.push(
        "You're getting close! Keep practicing to boost your accuracy to above 90%."
      );
    } else {
      suggestions.push(
        "Great job! You're achieving high accuracy. Keep it up!"
      );
    }

    // Streak suggestions
    if (streak.currentStreak < 7) {
      suggestions.push(
        "Try to maintain a streak of 7 days to build consistency and improve over time."
      );
    } else if (streak.currentStreak >= 7 && streak.currentStreak < 30) {
      suggestions.push(
        "Well done! You've built a solid streak. Aim for a 30-day streak to reach new heights."
      );
    } else if (streak.currentStreak >= 30) {
      suggestions.push(
        "You're doing fantastic with your streak! Keep challenging yourself to beat your longest streak."
      );
    }

    // Check for fluctuations in user pitch compared to original pitch
    const pitchFluctuationThreshold = 10; // Adjust threshold based on desired sensitivity
    let largeFluctuations = userPitchData.filter((userPitch, index) => {
      const originalPitch = originalPitchData[index]?.frequency;
      return (
        originalPitch &&
        Math.abs(userPitch.frequency - originalPitch) >
          pitchFluctuationThreshold
      );
    });

    if (largeFluctuations.length > 0) {
      suggestions.push(
        "Your pitch fluctuated significantly in certain sections. Practice controlling your pitch for better accuracy."
      );
    }

    // Custom messages based on longest streak
    if (streak.currentStreak > streak.longestStreak) {
      suggestions.push(
        "You’ve beaten your longest streak! Keep up the momentum and push for even longer streaks."
      );
    } else {
      suggestions.push(
        `Your longest streak is ${streak.longestStreak} days. Try to beat it by practicing consistently.`
      );
    }

    // Any other personalized suggestions you want to include based on user data can be added here.

    return suggestions;
  } catch (error) {
    console.error("Error generating personalized suggestions: ", error);
    return [
      "There was an error generating personalized suggestions. Please try again later.",
    ];
  }
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
