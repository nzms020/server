const { JsonBinIoApi } = require("jsonbin-io-api");
const express = require("express");
const http = require("http");
const fetch = require("node-fetch");
const path = require("path");
const cors = require("cors");
const api = new JsonBinIoApi(process.env.JSONID);

const app = express();

const fs = require("fs");

const datajson = require("./data.json");


// // makeshift cron
// const schedule = require('node-schedule');
// const job = schedule.scheduleJob('0 0 * * *', updateList());


let allAlbums = [];
let IDUrls = [];
let links = [];
let linksJson = [];
let json = [];
let sumOfReleases = 0;

// server stuff

require("dotenv").config();

app.use(express.static("public"));
app.use(cors());

app.listen(process.env.PORT, () => {});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + "/index.html"));
});

app.get("/data/", (req, res) => {
  res.send(datajson);
});

app.get("/refresh/", (req, res) => {
  updateList();
});

app.get("/refresh/?/", (req, res) => {});


// env

const clientId = process.env.SPOTIFYCLIENT;
const clientSecret = process.env.SPOTIFYKEY;
const songLinkSecret = process.env.SONGLINKKEY;


// big fetching

function updateList(linksFinal) 
{

  const getToken = async () => {
    const result = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(clientId + ":" + clientSecret).toString("base64"),
      },
      body: "grant_type=client_credentials",
    });

    const data = await result.json();
    return data.access_token;
  };
  

  // get member's latest albums and singles

  
  // s020

  const getS020 = async (token) => {
    const result = await fetch(
      `https://api.spotify.com/v1/artists/50TYVva5K2RbMfghMsOm3G/albums?include_groups=single%2Calbum%2Cappears_on&market=US&limit=50`,
      {
        method: "GET",
        headers: { Authorization: "Bearer " + token },
      }
    );

    const data = await result.json();
    return data.items;
  };

  // bleachboy

  const getBLEACHBOY = async (token) => {
    const result = await fetch(
      `https://api.spotify.com/v1/artists/7oQZreOCK7ryGSl9La8OH1/albums?include_groups=single%2Calbum%2Cappears_on&market=US&limit=50`,
      {
        method: "GET",
        headers: { Authorization: "Bearer " + token },
      }
    );

    const data = await result.json();
    return data.items;
  };

  // poodlemask

  const getPoodleMask = async (token) => {
    const result = await fetch(
      `https://api.spotify.com/v1/artists/7mYKQ1U63klyI8871lEcoo/albums?include_groups=single%2Calbum%2Cappears_on&market=US&limit=50`,
      {
        method: "GET",
        headers: { Authorization: "Bearer " + token },
      }
    );

    const data = await result.json();
    return data.items;
  };
  

  // get data and push to allAlbums object

  getToken().then((token) => {
    Promise.all([
      getBLEACHBOY(token),
      getPoodleMask(token),
      getS020(token),
    ]).then((r) => {
      
      // push all releases into object
      
      r.forEach((x) => allAlbums.push(x));
      
      
      // calculate sum of all releases
      
      for (z = 0; z < allAlbums.length++; z++)
        {
          sumOfReleases += allAlbums[z].length;
                    
        }
      
      links.push(allAlbums);
      combineInfoWithLinks();
      
    });
  });
  

}

// this function combines the spotify data of all the songs with links to the other streaming platforms using the song.link API

function combineInfoWithLinks() {
  
  
  // loop through the artist arrays 
  
  for (i = 0; i < sumOfReleases++; i++)
    {
      
      // loop through the artist's releases
      
      for (j = 0; j < allAlbums[i].length++; j++)
        { 
          
          fetch('https://api.song.link/v1-alpha.1/links?url=' + allAlbums[i][j].uri + songLinkSecret,
          {
              credentials: "same-origin",
          })
          .then(response => response.json())
          .then(data => {
            
            links.push(data);
            
            
            if (links.length == sumOfReleases)
              {
                console.log(links);
                linksJson = JSON.stringify(links);
                writeData(linksJson);
              }
          })
        }
    }
}

function writeData(json)
{
  fs.writeFile("./data.json", json, function (err) {
    if (err) throw err;
  });
}

