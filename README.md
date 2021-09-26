# What's this
これは超A&GをFFmpegで録画できるようにする簡易的なツールです，（使いやすくなるよう開発中）

# 背景
超A＆Gは2021年10月現在FFmpegで取得することが難しかったのですが，  
その原因はm3u8ファイル内に記載されているリンクが不鮮明なことに起因するものでした．  
そのため，そのm3u8ファイルを正しく書き換えてくれるプログラムを作りました．

録画が可能であることを確認しています．
# 使い方
node.jsとffmpegが使えることを想定しています．  
```
$ npm install
$ node app.js
App listening at http://localhost:3000
```
この状態で，現ディレクトリにて以下を実行します．
-t は録画時間（秒） test.mp4は適宜書き換えてください．
```
$ ffmpeg -protocol_whitelist file,http,https,tcp,tls,crypto -t 60 -i start.m3u8 test4.mp4
```
# 今後の予定
超A&G用の録画サーバー向けツール（Linux上で動作）するようなものを作る予定です，  
スケジューリング機能や番組表から予約できるようにしたいなぁ