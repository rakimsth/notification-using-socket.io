const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);

const Notifications = require("./models/notifications");

const router = express.Router();

const port = process.env.API_PORT || 3001;

// jsonifying
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// allowing CORS:
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,HEAD,OPTIONS,POST,PUT,DELETE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Acc" +
      "ess-Control-Request-Method, Access-Control-Request-Headers"
  );

  // no cache
  res.setHeader("Cache-Control", "no-cache");
  next();
});

app.use(express.static("build"));

// API

router.get("/", (req, res) => {
  res.json({ message: "API Initialized!" });
});

router.get("/notifications", (req, res) => {
  Notifications.find((err, notifications) => {
    if (err) {
      res.send(err);
    }
    return res.json(notifications);
  });
});

router.put("/notifications", () => {
  Notifications.find((err, notifs) => {
    notifs.forEach((notif) => {
      notif.read = true;
      notif.save();
    });
  });
});

router.delete("/notifications", (req, res) => {
  Notifications.remove({}, (err) => {
    if (err) {
      console.log(err);
    }
    console.log("Database Truncated");
    res.send("/");
  });
});

app.use("/api", router);

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Database
mongoose.connect("mongodb://localhost:27017/websocket");

// Dummy Data
const image = [
  "https://avatars.githubusercontent.com/u/23047979?v=4",
  "https://avatars.githubusercontent.com/u/9823807?v=4",
  "https://avatars.githubusercontent.com/u/9801330?v=4",
  "https://avatars.githubusercontent.com/u/30525503?v=4",
  "https://avatars.githubusercontent.com/u/57517694?v=4",
];
const name = ["Raktim", "Manjik", "Binod", "Rojan", "Sailendra"];
const action = ["liked", "commented on", "shared"];
const content = ["photo", "post", "video"];

// Socket config
io.on("connection", (socket) => {
  console.log("Connected");

  // On connection start pushing notifications to database
  const notificationsPush = setInterval(() => {
    // create a random notification
    const notification = new Notifications();
    notification.image = image[Math.floor(Math.random() * image.length)];
    notification.name = name[Math.floor(Math.random() * name.length)];
    notification.action = action[Math.floor(Math.random() * action.length)];
    notification.content = content[Math.floor(Math.random() * content.length)];
    notification.read = false;

    notification.save((err) => {
      if (err) {
        // alert(err);
      }
      console.log("Added New Notification");

      // Push new notification to client
      socket.emit("new-notification", notification);
    });
  }, 3000 + Math.floor(Math.random() * 4000));

  socket.on("disconnect", () => {
    clearInterval(notificationsPush);
    console.log("Disconnected");
  });
});
