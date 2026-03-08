import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import App from './App.vue';
import { router } from './router';
import { fetchRules } from './lib/api';
import { setRules } from './lib/dnd';
import './styles/main.css';
async function bootstrap() {
    const rules = await fetchRules();
    setRules(rules);
    const app = createApp(App);
    app.use(createPinia());
    app.use(router);
    app.use(ElementPlus);
    app.mount('#app');
}
bootstrap().catch((error) => {
    console.error('Failed to bootstrap app', error);
    document.body.innerHTML = '<div style="padding:24px;color:#f38b7b;background:#081018;font-family:Segoe UI, PingFang SC, sans-serif;">规则数据加载失败，请确认后端已启动并刷新页面。</div>';
});
