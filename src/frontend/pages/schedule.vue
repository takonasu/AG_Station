<template>
  <section class="section">
    <div class="content">
      <h1 class="title">超A&G番組予約</h1>

      <h2 class="subtitle">今後の放送</h2>
      <div
        v-for="program in todayProgramList"
        :key="program.ft"
        @click="
          modalInfo.title = program.title
          modalInfo.pfm = program.pfm
          modalInfo.view = true
          modalInfo.ft = program.ft
          modalInfo.to = program.to
          modalInfo.dur = program.dur
        "
      >
        <div
          v-if="$dayjs().isBefore($dayjs(program.to))"
          class="card"
          style="margin: 10px"
        >
          <div class="card-content">
            <div class="content">
              <p class="title is-4">
                {{ program.title }}
              </p>
              <p class="subtitle is-6">{{ program.pfm }}</p>
              <p>
                開始：{{ convertDate(program.ft) }}
                <br />
                終了：{{ convertDate(program.to) }}
                <br />
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="modalInfo.view" class="modal is-active">
      <div class="modal-background" @click="modalInfo.view = false"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">番組の録画予約</p>
          <button
            class="delete"
            aria-label="close"
            @click="modalInfo.view = false"
          ></button>
        </header>
        <section class="modal-card-body">
          <p class="title is-4">
            {{ modalInfo.title }}
          </p>
          <p class="subtitle is-6">{{ modalInfo.pfm }}</p>
          <p>
            開始：{{ convertDate(modalInfo.ft) }}
            <br />
            終了：{{ convertDate(modalInfo.to) }}
            <br />
            番組時間：{{ modalInfo.dur }}分
          </p>
        </section>
        <footer class="modal-card-foot">
          <button
            class="button is-success is-active"
            @click="
              requestRecord(modalInfo.title, modalInfo.ft, modalInfo.dur * 60)
            "
          >
            予約
          </button>
          <button class="button" @click="modalInfo.view = false">閉じる</button>
        </footer>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: 'HomePage',

  components: {},
  data() {
    return {
      todayProgramList: [],
      modalInfo: {
        view: false,
        title: '',
        pfm: '',
        ft: '',
        to: '',
        dur: '',
      },
    }
  },
  mounted() {
    this.$axios
      .get('/api2/all?isRepeat=true')
      .then((response) => (this.todayProgramList = response.data))
  },
  methods: {
    convertDate(date) {
      return this.$dayjs(date).format('YYYY年MM月DD日(dd) HH時mm分')
    },
    // programTime 秒
    requestRecord(name, start, programTime) {
      const formattedStartTime = this.$dayjs(start).format(
        'YYYY-MM-DDTHH:mm:ss'
      )
      const params = {
        // 渡したいパラメータをJSON形式で書く
        length: programTime,
        name,
        start: formattedStartTime,
      }
      const queryParams = new URLSearchParams(params)
      this.$axios
        .get('/api/schedule?' + queryParams)
        .then((response) => {
          this.toastSuccess('録画予約をしました．')
          this.modalInfo.view = false
          console.log(response.data)
        })
        .catch((error) => {
          console.error('Error:', error.response.data.error)
          this.toastDanger(error.response.data.error)
        })
    },
    toastDanger(error) {
      this.$buefy.toast.open({
        duration: 2000,
        message: '予約失敗：' + error,
        type: 'is-danger',
      })
    },
    toastSuccess(info) {
      this.$buefy.toast.open({
        duration: 2000,
        message: info,
        type: 'is-success',
      })
    },
  },
}
</script>
