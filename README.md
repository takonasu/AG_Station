# AG Station Backend

![番組表から予約](https://work.takonasu.net/AGStation-1.png)
![予約一覧](https://work.takonasu.net/AGStation-2.png)
（画像はフロントエンドです．このリポジトリはバックエンドです．）

# What's this

このツールは，ffmpeg で録画できる超 A&G への予約を支援するツールです．  
WEB フロントエンド経由で予約録画できるほか，手動で ffmpeg を利用して録画できます．

# 背景

超 A＆G は 2021 年 10 月現在 ffmpeg で取得することが難しかったのですが，  
その原因は m3u8 ファイル内に記載されているリンクが相対パスなことに起因するものでした．  
そのため，その m3u8 ファイル内に記載されている絶対パスに書き換えてくれるプログラムを作りました．

録画が可能であることを確認しています．

# 使い方

Docker と docker-compose が使えることを想定しています．

```
$ docker-compose up -d
```

初回はエラーによって立ち上がらない場合があります．その場合は再度 ` docker-compose -d` を実行してみてください．（mySQL よりも先に express バックエンドが立ち上がってしまうことがあるため）

以下利用したい方法を選んで実行してください

## 録画ツールを利用して録画する場合（推奨）

番組表を利用して予約録画ができます．
[こちら](https://github.com/takonasu/AG_Station_Frontend)のリポジトリを参照してください．  
録画データは `src/recorded` に保存されます．

## ffmpeg の CLI を利用して手動で録画する場合

この状態で，現ディレクトリにて以下を実行します．
-t は録画時間（秒） test.mp4 は適宜書き換えてください．

```
$ ffmpeg -protocol_whitelist file,http,https,tcp,tls,crypto -t 60 -i http://localhost:4000/start.m3u8 test.mp4
```

# 仕組み

node.js から ffmpeg を呼び出すため，ffmpeg のインストールが必須です．（Docker 環境下の場合は既にインストールされています．）  
超 A&G の動画配信は暗号化されていないため，当ツールは復号等の処理を一切していません．録画自体の処理は全て ffmpeg に一任しています．  
ffmpeg は当ツール経由で m3u8 ファイルを超 A&G のサーバーにリクエストします．  
超 A＆G サーバーから返ってきた m3u8 ファイルのリンクが相対パスであるため，当ツールはそれを絶対パスに書き換え，ffmpeg に返却します．  
ffmpeg はその m3u8 ファイルに記述された絶対パスで書かれた超 A&G のサーバーにアクセスをして録画を開始します．
