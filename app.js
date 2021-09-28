const express = require('express');
const axiosBase = require('axios');
const { exec } = require('child_process');
const app = express();
const schedule = require('node-schedule');
const fs = require('fs');
let dayjs = require('dayjs')


const port = 4000;
// 実際のts動画ファイルを提供しているサーバー
const AGServer = `https://icraft.hs.llnwd.net`;
// m3u8ファイルを提供しているサーバー
const m3u8BaseURL = `https://fms2.uniqueradio.jp`;

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    next();
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

    const axios = axiosBase.create({
        baseURL: m3u8BaseURL,
    });
    axios.get('agqr10/aandg1.m3u8')
        .then(function (response) {
            const finalM3u8 = response.data.replace(/(aandg1-[0-9]{13}.ts)/g, `${AGServer}/agqr10/$1`);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
            res.end(finalM3u8);
        })
        .catch(function (error) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(`{"error": "ERROR!! occurred in Backend."}`);
            console.log('ERROR!! occurred in Backend.\n' + error);
        });
});

// ffmpegで録画を実行．
app.get('/record', (req, res) => {

    res.setHeader('Content-Type', 'application/json');
    if (!req.query.time || !req.query.name) {
        res.statusCode = 400;
        res.end(`{"error": "timeとnameパラメータを指定してください．"}`);
        return;
    }
    startRecord(req.query.time, req.query.name);
    res.statusCode = 200;
    res.end(`{"message": "OK"}`);
});

// 番組表APIへ代理アクセスして返却
app.get('/all', (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    const axios = axiosBase.create({
        baseURL: `https://agqr.sun-yryr.com/api`,
        headers: {
            'Content-Type': 'application/json',
        },
        responseType: 'json'
    });
    axios.get('all?isRepeat=true')
        .then(function (response) {
            console.log(response.data);
            res.statusCode = 200;
            res.end(JSON.stringify(response.data));
        })
        .catch(function (error) {
            res.statusCode = 500;
            res.end(`{"error": "ERROR!! occurred in Backend."}`);
            console.log('ERROR!! occurred in Backend.\n' + error);
        });
});



/* 予約録画を受け付ける
// name: 番組名
// start: 2021-09-27T11:23:30
// length: 秒
*/
app.get('/schedule', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if (!req.query.start || !req.query.name || !req.query.length) {
        res.statusCode = 400;
        res.end(`{"error": "length,name,startパラメータを指定してください．"}`);
        return;
    }

    if (!req.query.start.match(/[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}/)) {
        res.statusCode = 400;
        res.end(`{"error": "startパラメータが不正です．例：2021-09-27T11:23:30"}`);
        return;
    }

    if (Date.parse(req.query.start) < new Date().getTime()) {
        res.statusCode = 400;
        res.end(`{"error": "指定された録画開始時刻を過ぎています．"}`);
        return;
    }


    const record = getRecordInfo();
    // 既にデータが登録されている場合は登録しない
    const duplicateData = record.filter(elm => {
        return elm.startTime === req.query.start;
    });
    if (duplicateData.length != 0) {
        res.statusCode = 400;
        res.end(`{"error": "既に予約済みです"}`);
        console.log("既に予約済みです．");
        return;
    }

    addRecordingSchedule(req.query.name, req.query.start, req.query.length);
    res.statusCode = 200;
    res.end(`{"message": "OK"}`);
});

// 予約情報を返却
app.get('/scheduleInfo', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify(getRecordInfo()));
});

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
})

/* 録画予約をする関数
// programName: 番組名
// recordStartTime: 2021-09-27T11:23:30
// programTimeLength: 秒
*/
function addRecordingSchedule(programName, recordStartTime, programTimeLength) {

    if (!recordStartTime.match(/[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}/)) {
        console.log("開始時間のフォーマットが不正です．");
        return;
    }

    if (Date.parse(recordStartTime) < new Date().getTime()) {
        console.log("指定された録画開始時刻を過ぎています．");
        return;
    }

    const rule = Date.parse(recordStartTime);
    rule.tz = "Asia/Tokyo";
    const job = schedule.scheduleJob(rule, function () {
        console.log(`録画開始\n番組名：${programName}\n録画開始時間：${recordStartTime}\n番組の長さ：${programTimeLength}`);
        // 出力ファイル名
        const outputName = `${recordStartTime}_${programName}.mp4`;
        startRecord(programTimeLength, outputName);
        let record = getRecordInfo();
        const index = record.findIndex(elm => {
            return elm.startTime === recordStartTime;
            })
        record[index].recorded = true;
        writeRecordInfo(record);
    });
    console.log(`録画受付\n番組名：${programName}\n録画開始時間：${recordStartTime}\n番組の長さ：${programTimeLength}`);
    addRecordInfo({
        "programName": programName,
        "startTime": recordStartTime,
        "programLength": programTimeLength,
        "recorded": false
    })
}


/* 録画を開始する関数
// outputName: 出力ファイル名
// programTimeLength: 秒
*/
function startRecord(programTimeLength, outputName) {
    // 記号をエスケープ（インジェクション対策）
    programTimeLength = programTimeLength.replace(/[^0-9]+/g, ``);
    outputName = outputName.replace(/[!-,:-@[-^'{-~/ ]/g, ``);
    exec(`ffmpeg -protocol_whitelist file,http,https,tcp,tls,crypto -t ${programTimeLength} -i http://localhost:${port}/start.m3u8 ${outputName}`, (err, stdout, stderr) => {
        if (err) {
            console.log(`stderr: ${stderr}`)
            return
        }
    });
}

// 録画予約情報を取得して返す
function getRecordInfo() {
    return require('./record.json');
}

// 録画予約情報をJSONファイルに書き込む
function writeRecordInfo(data) {
    fs.writeFile('./record.json', JSON.stringify(data, null, '    '), (err) => {
        if (err) console.log(`error!::${err}`);
    });
}

// 録画情報をJSONファイルに追加する
function addRecordInfo(data) {
    let record = getRecordInfo();
    // 既にデータが登録されている場合は登録しない
    const duplicateData = record.filter(elm => {
        return elm.startTime === data.startTime;
    });
    if (duplicateData.length != 0) {
        return;
    }
    record.push(data);
    writeRecordInfo(record);
}

// 起動時の処理
function startProcess() {
    // 録画情報を取得して現在が録画開始時刻前である番組をスケジューリングする
    const record = getRecordInfo();
    const schedulePrograms = record.filter(elm => {
        return dayjs().isBefore(dayjs(elm.startTime))
    })
    schedulePrograms.forEach(elm => {
        if (elm.recorded == false){
            addRecordingSchedule(elm.programName, elm.startTime, elm.programLength);
        }
    })
}
startProcess();