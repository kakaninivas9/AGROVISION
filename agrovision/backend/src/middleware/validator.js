const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ error: "Name must be at least 2 characters long" });
  }
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: "Please enter a valid email address" });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters long" });
  }
  next();
};

const validateLogin = (req, res, next) => {
  const { identifier, password } = req.body;
  if (!identifier) {
    return res.status(400).json({ error: "Email or Full Name is required" });
  }
  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }
  next();
};

module.exports = {
  validateRegister,
  validateLogin
};
