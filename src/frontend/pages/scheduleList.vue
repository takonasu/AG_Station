<template>
  <section class="section">
    <div class="content">
      <h1 class="title">予約済み番組一覧</h1>

      <div
        v-for="program in scheduleList"
        :key="program.startTime"
        @click="
          modalInfo.id = program.id
          modalInfo.title = program.program_name
          modalInfo.view = true
          modalInfo.ft = program.start_time
          modalInfo.dur = program.program_length
        "
      >
        <div v-if="program.recorded == false" class="card" style="margin: 10px">
          <div class="card-content">
            <div class="content">
              <p class="title is-4">
                {{ program.program_name }}
              </p>
              <p>
                開始：{{ convertDate(program.start_time) }}
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
          <p class="modal-card-title">予約情報詳細</p>
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
            番組時間：{{ modalInfo.dur }}秒
          </p>
        </section>
        <footer class="modal-card-foot">
          <button
            class="button is-danger is-active"
            @click="deleteRecord(modalInfo.id)"
          >
            予約キャンセル
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
      scheduleList: [],
      modalInfo: {
        view: false,
        id: '',
        title: '',
        pfm: '',
        ft: '',
        to: '',
        dur: '',
      },
    }
  },
  mounted() {
    this.getScheduleData()
  },
  methods: {
    convertDate(date) {
      return this.$dayjs(date).format('YYYY年MM月DD日(dd) HH時mm分')
    },
    getScheduleData() {
      this.$axios
        .get('/api/scheduleInfo')
        .then((response) => (this.scheduleList = response.data))
    },
    deleteRecord(uuid) {
      this.$axios
        .delete('/api/scheduleCancel', { data: { id: uuid } })
        .then((res) => {
          console.log(res.data)
          this.toastSuccess('録画予約をキャンセルしました．')
          this.modalInfo.view = false
          this.getScheduleData()
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
