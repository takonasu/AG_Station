const express = require('express');
const axiosBase = require('axios');
const { exec } = require('child_process');
const app = express();
const schedule = require('node-schedule');


const port = 3000;
// 実際のts動画ファイルを提供しているサーバー
const AGServer = `https://icraft.hs.llnwd.net`;
// m3u8ファイルを提供しているサーバー
const m3u8BaseURL = `https://fms2.uniqueradio.jp`;

app.use(express.static('public'));

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

    const axios = axiosBase.create({
        baseURL: m3u8BaseURL,
    });
    axios.get('agqr10/aandg1.m3u8')
        .then(function (response) {
            const finalM3u8 = response.data.replace(/(aandg1-[0-9]{13}.ts)/g, `${AGServer}/agqr10/$1`);
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
    res.setHeader('Content-Type', 'application/json');
    if (!req.query.time || !req.query.name) {
        res.end(`{"error": "timeとnameパラメータを指定してください．"}`);
        return;
    }
    startRecord(req.query.time, req.query.name);
    res.end(`{"message": "OK"}`);
});

// 番組表APIへ代理アクセスして返却
app.get('/all', (req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');

    const axios = axiosBase.create({
        baseURL: `https://agqr.sun-yryr.com/api`,
        headers: {
            'Content-Type': 'application/json',
        },
        responseType: 'json'
    });
    axios.get('all')
        .then(function (response) {
            console.log(response.data);
            res.end(JSON.stringify(response.data));
        })
        .catch(function (error) {
            console.log('ERROR!! occurred in Backend.\n' + error);
        });
});



/* 予約録画を受け付ける
// name: 番組名
// start: 2021-09-27T11:23:30
// time: 秒
*/
app.get('/schedule', (req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    if (!req.query.start || !req.query.name || !req.query.time) {
        res.end(`{"error": "time,name,startパラメータを指定してください．"}`);
        return;
    }

    if (!req.query.start.match(/[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}/)) {
        res.end(`{"error": "startパラメータが不正です．例：2021-09-27T11:23:30"}`);
        return;
    }

    if (Date.parse(req.query.start) < new Date().getTime()) {
        res.end(`{"error": "指定された録画開始時刻を過ぎています．"}`);
        return;
    }
    addRecordingSchedule(req.query.name, req.query.start, req.query.time);
    res.end(`{"message": "OK"}`);
});


app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
})

/* 録画予約をする関数
// name: 番組名
// start: 2021-09-27T11:23:30
// recordingTime: 秒
*/
function addRecordingSchedule(name, datestr, recordingTime) {

    if (!datestr.match(/[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}/)) {
        console.log("開始時間のフォーマットが不正です．");
        return;
    }

    if (Date.parse(datestr) < new Date().getTime()) {
        console.log("指定された録画開始時刻を過ぎています．");
        return;
    }

    const rule = Date.parse(datestr);
    rule.tz = "Asia/Tokyo";
    const job = schedule.scheduleJob(rule, function () {
        console.log(`録画開始\n番組名：${name}\n録画開始時間：${datestr}\n番組の長さ：${recordingTime}`);
        // 出力ファイル名
        const outputName = `${datestr}_${name}.mp4`;
        startRecord(recordingTime, outputName);
    });
    console.log(`録画受付\n番組名：${name}\n録画開始時間：${datestr}\n番組の長さ：${recordingTime}`);
}


/* 録画を開始する関数
// outputName: 出力ファイル名
// recordingTime: 秒
*/
function startRecord(recordingTime, outputName) {
    // 記号をエスケープ（インジェクション対策）
    recordingTime = recordingTime.replace(/[^0-9]+/g, ``);
    outputName = outputName.replace(/[!-,:-@[-^'{-~/ ]/g, ``);
    exec(`ffmpeg -protocol_whitelist file,http,https,tcp,tls,crypto -t ${recordingTime} -i http://localhost:${port}/start.m3u8 ${outputName}`, (err, stdout, stderr) => {
        if (err) {
            console.log(`stderr: ${stderr}`)
            return
        }
        console.log(`stdout: ${stdout}`)
    });
}
