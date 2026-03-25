module.exports = {
  apps: [
    {
      name: "admin-backend",
      script: "node_modules/tsx/dist/cli.mjs",
      args: "src/index.ts",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
