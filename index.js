const e = require('express');
const express = require('express');
const fetch = require('node-fetch');
const redis = require('redis');
const app = express();
const PORT = 5000;
const REDIS_PORT = 6379;
const client = redis.createClient(REDIS_PORT);

client.connect();

client.on('connect', function() {
    console.log('Connected!');
});

function setResponse(id, title) {
    return `Picture with  ${id} has title: ${title}`
}

function setResponseforPhotos(data, i){
    return `picture with  id ${i} has url: ${data[i-1].title}`
}

function setResponseforCompleteData(data){
    let s = ` `;
    for(i=1; i< 11; i++){
        s = s+ setResponseforPhotos(data, i) + `<br>`;
    }
    return s;
}

async function cachePhotos(req, res, next){
    console.log("inside cache photos");
    const isNull = await client.hLen();;
    let s = ` `;
    if (isNull != 0){
        for (i = 1; i<11; i++){
            let output = await client.hGetAll(i);
            s = s + setResponseforPhotos(output, i) + `<br>`;
        }
        res.send(s);
    }
    else{
        next();
    }
}

async function cache(req, res, next) {
    const Id  = req.params;
    const reply = await client.get(Id);
    console.log("id :", Id);
    console.log("reply is :", reply);
    if (reply != null) {
     res.send(setResponse(Id, reply));
    }
    else{
     next();
    }
}

async function getRepos(req, res, next) {
    try {
        console.log("fetching data");
        const { username } = req.params;
        const response = await fetch(`https://jsonplaceholder.typicode.com/photos`);
        const data = await response.json();
        console.log(data[2]);
        for(i = 0; i< 10; i++){
            client.hSetNX(data[i].id, data[i].id, data[i].title);
        }
        res.send(setResponseforCompleteData(data));
        next();
    }
    catch (err) {
        console.error(err);
    }
}

async function getReposWithId(req, res, next) {
    try {
        console.log("fetching individual data");
        const { Id } = req.params;
        const response = await fetch(`https://jsonplaceholder.typicode.com/photos/${req.params.Id}`);
        const data = await response.json();
       // const reply = await client.get(Id);
       console.log(data.title)
       client.setEx(Id, 3600, data.title);
       res.send(setResponse(Id, data.title));
    }
    catch (error) {
        console.error(error);
    }
}

app.get('/', cachePhotos, getRepos);
app.get('/:Id',  getReposWithId);

app.listen(5000, () => {
    console.log("listening on port 5000!")
})