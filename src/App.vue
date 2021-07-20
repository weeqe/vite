<template>
  <div>
    App
    <span>
      {{ title }}
    </span>
  </div>
</template>

<script lang="ts">
import {reactive, toRefs} from 'vue'

export default {
  setup() {
    const state = reactive({
      title: 'hello vue'
    })
    return {
      ...toRefs(state)
    }
  }
}

</script>

<style lang="scss" scoped>

</style>
