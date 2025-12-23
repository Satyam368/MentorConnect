require('dotenv').config();

console.log("Checking Critical Core Variables...");

const coreVars = ['JWT_SECRET', 'MONGO_URI', 'PORT'];

coreVars.forEach(varName => {
    if (process.env[varName]) {
        console.log(`${varName}: SET`);
    } else {
        console.log(`${varName}: MISSING`);
    }
});
