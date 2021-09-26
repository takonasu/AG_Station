const express = require('express')
const axiosBase = require('axios');
const app = express()
const port = 3000;

const AGServer = `icraft.hs.llnwd.net`;

const axios = axiosBase.create({
    baseURL: 'https://fms2.uniqueradio.jp/',
    // headers: {
    //     'Content-Type': 'application/json',
    //     'X-Requested-With': 'XMLHttpRequest'
    // },
    // responseType: 'json'
});

app.get('/start.m3u8', (req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');

    const finalM3u8 = `#EXTM3U\n#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=242455\nhttp://localhost:3000/aandg1.m3u8`

    res.end(finalM3u8);
});


app.get('/aandg1.m3u8', (req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');

    axios.get('agqr10/aandg1.m3u8')
        .then(function (response) {
            const finalM3u8 = response.data.replace(/(aandg1-[0-9]{13}.ts)/g, `https://${AGServer}/agqr10/$1`);
            console.log(finalM3u8)
            res.end(finalM3u8);
        })
        .catch(function (error) {
            console.log('ERROR!! occurred in Backend.\n' + error)
        });
});

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`)
})