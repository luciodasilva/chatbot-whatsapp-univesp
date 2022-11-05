const expres = require("express");
const router = expres.Router();
const whatsAppController = require("../controllers/whatsappControllers");

router
.get('/', function (req, res) {
    res.render('index', {});
  })
.get("/", whatsAppController.VerifyToken)
.post("/", whatsAppController.ReceivedMessage)

module.exports = router;