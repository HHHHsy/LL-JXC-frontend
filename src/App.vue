<template>
  <router-view />
</template>

<script setup>
</script>

<style>
html, body, #app {
  margin: 0;
  padding: 0;
  height: 100%;
}

/* 搜索区（inline 表单）筛选控件统一宽度：下拉/输入框不再挤成一团 */
.el-form--inline .el-select {
  width: 200px;
}
.el-form--inline .el-input {
  width: 200px;
}
.el-form--inline .el-date-editor--daterange {
  width: 260px;
}
/* 弹窗表单里的下拉保持整行宽度，不受影响 */
.el-dialog .el-form:not(.el-form--inline) .el-select,
.el-dialog .el-form:not(.el-form--inline) .el-input {
  width: 100%;
}
</style>
