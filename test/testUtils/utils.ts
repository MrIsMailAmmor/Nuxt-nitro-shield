const cleanIpCache = () => {
  const fs = require("fs");
  const path = require("path");
  const storagePath = path.resolve(__dirname, "../../.data/");

  if (fs.existsSync(storagePath)) {
    fs.rmSync(storagePath, { recursive: true, force: true });
  }
};

export { cleanIpCache };
