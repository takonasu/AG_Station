<template>
  <section class="section">
    <div class="content">
      <h1 class="title">このツールについて</h1>
      <p>
        簡易的に超A&amp;Gの録画予約ができます．
        <br />
        このツールは，ffmpegで録画できる超A&amp;Gへの予約を支援するツールです．
        <br />
        このツールによって起こる損害等は一切制作者は保証しません．利用者は利用者の責任の下で利用してください．
        <br />
        録画した動画を個人で楽しむ目的以外で利用することは著作権法により固く禁止されています．インターネット上にアップロードする等の行為は著作権法に違反します．
        <br />
        ソースコードは
        <a href="https://github.com/takonasu/AG_Station_Frontend">
          フロントエンド
        </a>
        <a href="https://github.com/takonasu/AG_Station_Backend">
          バックエンド
        </a>
        で公開されています。機能追加やバグ報告などコントリビュートをお待ちしています。
        <br />
      </p>
    </div>
    <div class="content">
      <h1 class="title">このツールの仕組み</h1>
      <p>
        node.jsからffmpegを呼び出すため，ffmpegのインストールが必須です．（Docker環境下の場合は既にインストールされています．）
        <br />
        超A&amp;Gの動画配信は暗号化されていないため，当ツールは復号等の処理を一切していません．録画自体の処理は全てffmpegに一任しています．
        <br />
        ffmpegは当ツール経由でm3u8ファイルを超A&amp;Gのサーバーにリクエストします．
        <br />
        超A＆Gサーバーから返ってきたm3u8ファイルのリンクが相対パスであるため，当ツールはそれを絶対パスに書き換え，ffmpegに返却します．
        <br />
        ffmpegはそのm3u8ファイルに記述された絶対パスで書かれた超A&amp;Gのサーバーにアクセスをして録画を開始します．
      </p>
    </div>
    <div class="content">
      <h1 class="title">番組表APIについて</h1>
      <p>
        このソフトウェアは
        <a href="https://github.com/sun-yryr/agqr-program-guide">こちら</a>
        の番組表APIを利用しています．
      </p>
    </div>
  </section>
</template>
