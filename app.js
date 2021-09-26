const express = require('express');
const axiosBase = require('axios');
const { exec } = require('child_process')
const app = express();
const port = 3000;

// 実際のts動画ファイルを提供しているサーバー
const AGServer = `icraft.hs.llnwd.net`;
// m3u8ファイルを提供しているサーバー
const axios = axiosBase.create({
    baseURL: 'https://fms2.uniqueradio.jp/',
});

// ffmpeg等へ録画を始めるためのm3u8ファイルを提供
app.get('/start.m3u8', (req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    const finalM3u8 = `#EXTM3U\n#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=242455\nhttp://localhost:${port}/aandg1.m3u8`;
    res.end(finalM3u8);
});

// ffmpeg等へA&Gサーバからの内容を書き換えて最新のm3u8ファイルを提供．
app.get('/aandg1.m3u8', (req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');

    axios.get('agqr10/aandg1.m3u8')
        .then(function (response) {
            const finalM3u8 = response.data.replace(/(aandg1-[0-9]{13}.ts)/g, `https://${AGServer}/agqr10/$1`);
            // console.log(finalM3u8);
            res.end(finalM3u8);
        })
        .catch(function (error) {
            console.log('ERROR!! occurred in Backend.\n' + error);
        });
});

// ffmpegで録画を実行．
app.get('/record', (req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    if (!req.query.time || !req.query.name) {
        res.end(`timeとnameパラメータを指定してください．`);
        return;
    }
    // 特殊文字をエスケープ（インジェクション対策）
    const recordingTime = req.query.time.replace(/[^0-9]+/g, ``);
    const outputName = req.query.name.replace(/[^a-z.0-9]+/g, ``);

    exec(`ffmpeg -protocol_whitelist file,http,https,tcp,tls,crypto -t ${recordingTime} -i http://localhost:${port}/start.m3u8 ${outputName}`, (err, stdout, stderr) => {
        if (err) {
            console.log(`stderr: ${stderr}`)
            return
        }
        console.log(`stdout: ${stdout}`)
    });
    res.end(`name: ${recordingTime}<br>time: ${outputName}\nrecording...`);
});

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
})