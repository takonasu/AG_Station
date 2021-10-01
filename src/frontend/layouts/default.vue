<template>
  <div>
    <nav
      class="navbar header has-shadow is-primary"
      role="navigation"
      aria-label="main navigation"
    >
      <div class="navbar-brand">
        <h1 class="navbar-item has-text-weight-semibold is-size-4">
          AG Station(β)
        </h1>
      </div>
    </nav>

    <section class="main-content columns">
      <aside class="column is-2 section">
        <ul class="menu-list">
          <li v-for="(item, key) of items" :key="key">
            <NuxtLink :to="item.to" exact-active-class="is-active">
              <b-icon :icon="item.icon" />
              {{ item.title }}
            </NuxtLink>
          </li>
        </ul>
      </aside>

      <div class="container column is-10">
        <Nuxt />
      </div>
    </section>
  </div>
</template>

<script>
export default {
  data() {
    return {
      items: [
        {
          title: 'トップ',
          icon: 'home',
          to: { name: 'index' },
        },
        {
          title: '番組予約',
          icon: 'television-classic',
          to: { name: 'schedule' },
        },
        {
          title: '予約一覧',
          icon: 'clock-time-eight-outline',
          to: { name: 'scheduleList' },
        },
        {
          title: 'ジョブ実行済み一覧',
          icon: 'check',
          to: { name: 'recordedList' },
        },
        {
          title: 'その他',
          icon: 'lightbulb',
          to: { name: 'other' },
        },
      ],
    }
  },
}
</script>
