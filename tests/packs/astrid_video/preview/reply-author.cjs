const fs=require('node:fs');const {replyRevealRecipe}=require('./extensions/reply-reveal.js');console.log(JSON.stringify(replyRevealRecipe(JSON.parse(fs.readFileSync(0,'utf8')))));
