import express from 'express';
import axiosBase from 'axios';
import dayjs from 'dayjs';
import * as child_process from 'child_process';
import { Record } from './entities/Record';
import { getConnectionOptions, createConnection, BaseEntity } from 'typeorm';
import schedule from 'node-schedule';

const expressApp = async () => {
    const app: express.Express = express();
    const port = 4000;
    // 実際のts動画ファイルを提供しているサーバー
    const AGServer = `https://icraft.hs.llnwd.net`;
    // m3u8ファイルを提供しているサーバー
    const m3u8BaseURL = `https://fms2.uniqueradio.jp`;

    // --- TypeORMの設定
    const connectionOptions = await getConnectionOptions();
    const connection = await createConnection(connectionOptions);

    BaseEntity.useConnection(connection);

    // body-parserに基づいた着信リクエストの解析
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.get('/', async (req, res) => {
        const records = await Record.find();
        res.send(records);
    });

    // ffmpeg等へ録画を始めるためのm3u8ファイルを提供
    app.get('/start.m3u8', (req, res) => {
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        const finalM3u8 = `#EXTM3U\n#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=242455\nhttp://localhost:${port}/aandg1.m3u8`;
        res.status(200).send(finalM3u8);
    });

    // ffmpeg等へA&Gサーバからの内容を書き換えて最新のm3u8ファイルを提供．
    app.get('/aandg1.m3u8', (req, res) => {
        const axios = axiosBase.create({
            baseURL: m3u8BaseURL,
        });
        axios
            .get('agqr10/aandg1.m3u8')
            .then(function (response) {
                const finalM3u8 = response.data.replace(/(aandg1-[0-9]{13}.ts)/g, `${AGServer}/agqr10/$1`);
                res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
                res.status(200).send(finalM3u8);
            })
            .catch(function (error) {
                res.status(500).json({ error: 'ERROR!! occurred in Backend.' });
                console.log('ERROR!! occurred in Backend.\n' + error);
            });
    });

    // ffmpegで録画を実行．
    app.get('/record', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        if (!req.query.time || !req.query.name) {
            res.status(400).json({
                error: 'timeとnameパラメータを指定してください．',
            });
            return;
        }
        startRecord(parseInt(req.query.time as string), req.query.name as string);
        res.status(200).json({ message: 'OK' });
    });

    /*
    // 予約録画を受け付ける
    // name: 番組名
    // start: 2021-09-27T11:23:30
    // length: 秒
    */
    app.get('/schedule', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        if (!req.query.start || !req.query.name || !req.query.length) {
            res.status(400).json({
                error: 'length,name,startパラメータを指定してください．',
            });
            return;
        }

        const start = req.query.start as string;
        if (!start.match(/[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}/)) {
            res.status(400).json({
                error: 'startパラメータが不正です．例：2021-09-27T11:23:30',
            });
            return;
        }

        if (dayjs().isAfter(dayjs(start))) {
            res.status(400).json({
                error: '指定された録画開始時刻を過ぎています．',
            });
            return;
        }

        const length = Number(req.query.length);
        if (isNaN(length) || length <= 0) {
            res.status(400).json({
                error: 'lengthパラメータが不正です．正の数のみ受け付けます．',
            });
            return;
        }

        if (await checkRecord(dayjs(start).toDate())) {
            res.status(400).json({
                error: '既に予約済みです．',
            });
            return;
        }

        addRecordingSchedule(req.query.name as string, dayjs(start).toDate(), length);

        res.status(200).json({ message: 'OK' });
    });

    // 予約情報を返却
    app.get('/scheduleInfo', async (req, res) => {
        const records = await Record.find();
        res.status(200).json(records);
    });

    // 予約キャンセル
    app.delete('/scheduleCancel', async (req, res) => {
        const record = await Record.findOne({
            id: req.body.id as string,
        });
        if (record) {
            deleteSchedule(req.body.id as string);
            res.status(200).json({ message: 'OK' });
        } else {
            res.status(400).json({
                error: 'idパラメータが不正です．/scheduleInfo で取得できるIDを指定してください．',
            });
        }
    });

    app.listen(port, () => {
        console.log(`Example app listening on port ${port}`);
    });

    /*
    // 録画を開始する関数
    // outputName: 出力ファイル名
    // programTimeLength: 秒
    */
    function startRecord(programTimeLength: number, outputName: string) {
        // 記号をエスケープ（インジェクション対策）
        outputName = outputName.replace(/[!-,:-@[-^'{-~/ ]/g, ``);
        child_process.spawn('ffmpeg', [
            '-protocol_whitelist',
            'file,http,https,tcp,tls,crypto',
            '-t',
            String(programTimeLength),
            '-i',
            `http://localhost:${port}/start.m3u8`,
            `recorded/${outputName}`,
        ]);
    }

    /*
    // 録画予約をする関数
    // programName: 番組名
    // recordStartTime: 番組開始時間
    // programTimeLength: 秒
    */
    async function addRecordingSchedule(programName: string, recordStartTime: Date, programTimeLength: number) {
        if (dayjs().isAfter(dayjs(recordStartTime))) {
            console.log('指定された録画開始時刻を過ぎています．');
            return;
        }
        // DBに予約情報が存在するか確認
        if (!(await checkRecord(recordStartTime))) {
            // 無ければDBに情報を追加
            const record = new Record();
            record.program_name = programName;
            record.start_time = recordStartTime;
            record.program_length = programTimeLength;
            record.recorded = false;
            await record.save();
        }

        const record = await Record.findOne({
            program_name: programName,
            start_time: recordStartTime,
            program_length: programTimeLength,
            recorded: false,
        });
        if (record) {
            // 第一引数にユニークな名前を付けることでキャンセルに対応させる
            schedule.scheduleJob(record.id, recordStartTime, async function () {
                console.log(
                    `録画開始\n番組名：${programName}\n録画開始時間：${dayjs(recordStartTime).format(
                        'YYYY年MM月DD日HH時mm分'
                    )}\n番組の長さ：${programTimeLength}`
                );

                const record = await Record.findOne({
                    program_name: programName,
                    start_time: recordStartTime,
                    program_length: programTimeLength,
                    recorded: false,
                });

                if (record) {
                    record.recorded = true;
                    await record.save();
                }

                // 出力ファイル名
                const outputName = `${dayjs(recordStartTime).format('YYYY年MM月DD日HH時mm分')}_${programName}.mp4`;
                startRecord(programTimeLength, outputName);
            });
        }

        console.log(
            `録画受付\n番組名：${programName}\n録画開始時間：${dayjs(recordStartTime).format(
                'YYYY年MM月DD日HH時mm分'
            )}\n番組の長さ：${programTimeLength}`
        );
    }

    /* 
    // 予約ジョブをnode-scheduleからキャンセルしてDBから消去する関数
    // id: キャンセルしたいジョブのUUID，DBのUUIDと同一．
    */
    async function deleteSchedule(id: string) {
        const record = await Record.findOne({
            id: id,
        });
        if (record) {
            // 録画開始時刻を過ぎているものに関してはDBののみ消去
            if (dayjs().isAfter(dayjs(record.start_time))) {
                await record.remove();
            } else if (record.recorded == false) {
                schedule.scheduledJobs[id].cancel();
                await record.remove();
            } else {
                // 録画開始時刻を過ぎていないのに録画済みになってるヤバい奴はデータ不整合の可能性があるため消す
                await record.remove();
            }
        }
    }

    /* 
    // 指定時間に予約がすでに入っているかを確認する
    // recordStartTime: 番組開始時間
    */
    async function checkRecord(recordStartTime: Date) {
        const records = await Record.find({
            start_time: recordStartTime,
        });
        return records.length > 0;
    }

    /* 
    // 起動時に実行する．DBに入っている予約情報をジョブに再登録する．
    */
    async function startProcess() {
        const records = await Record.find({
            recorded: false,
        });
        records.forEach((elm) => {
            addRecordingSchedule(elm.program_name, elm.start_time, elm.program_length);
        });
    }
    startProcess();
};

expressApp();
