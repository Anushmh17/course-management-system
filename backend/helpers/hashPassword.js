const bcrypt = require("bcryptjs");

const password = "123456";

// 10 = bcrypt's cost/salt-round setting.
bcrypt.hash(password, 10, (err, hash) => {
    console.log(hash);
});
