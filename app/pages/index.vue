<script setup lang="ts">
const { t, locale, locales, setLocale } = useI18n();
const colorMode = useColorMode();
const toast = useToast();
const requestUrl = useRequestURL();

const selectedFile = ref<File | null>(null);
const jsonResult = ref("");
const errorMessage = ref("");
const isConverting = ref(false);
const isDragging = ref(false);
const dragDepth = ref(0);
const activeTab = ref("result");

const seoTitle = computed(() => t("seo.title"));
const seoDescription = computed(() => t("seo.description"));
const apiUrl = computed(() => new URL("/api/convert", requestUrl.origin).toString());
const curlCommand = computed(() => `curl -X POST -F "file=@your.pdf" ${apiUrl.value}`);
const isDark = computed(() => colorMode.value === "dark");

const tabItems = computed(() => [
  { label: t("tabs.result"), value: "result" },
  { label: t("tabs.api"), value: "api" },
]);

const currentLocale = computed({
  get: () => locale.value,
  set: (value) => {
    if (typeof value === "string") void setLocale(value);
  },
});

const localeItems = computed(() =>
  locales.value.map((item) => ({
    label: typeof item === "string" ? item : item.name || item.code,
    value: typeof item === "string" ? item : item.code,
  })),
);

useSeoMeta({
  title: seoTitle,
  description: seoDescription,
  ogTitle: seoTitle,
  ogDescription: seoDescription,
  ogImage: "/favicon.ico",
  twitterCard: "summary",
});

async function convertPdfToJson(file: File) {
  isConverting.value = true;
  jsonResult.value = "";
  errorMessage.value = "";

  try {
    const formData = new FormData();
    formData.append("file", file);
    const data = await $fetch(apiUrl.value, { method: "POST", body: formData });
    jsonResult.value = JSON.stringify(data, null, 2);
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : t("messages.conversion_failed");
  } finally {
    isConverting.value = false;
  }
}

function handleFileSelect(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) processFile(file);
}

function handleDrop(event: DragEvent) {
  event.preventDefault();
  isDragging.value = false;
  dragDepth.value = 0;
  const file = event.dataTransfer?.files?.[0];
  if (file) processFile(file);
}

function processFile(file: File) {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) {
    errorMessage.value = t("messages.invalid_file");
    return;
  }
  selectedFile.value = file;
  convertPdfToJson(file);
}

function downloadJson() {
  if (!jsonResult.value) return;
  const blob = new Blob([jsonResult.value], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = selectedFile.value?.name.replace(".pdf", ".json") || "result.json";
  anchor.click();
  URL.revokeObjectURL(url);
}

function copyJson() {
  if (!jsonResult.value) return;
  navigator.clipboard.writeText(jsonResult.value);
  toast.add({ title: t("messages.copied") });
}

function copyApiCommand() {
  navigator.clipboard.writeText(curlCommand.value);
  toast.add({ title: t("messages.copied") });
}

function reset() {
  selectedFile.value = null;
  jsonResult.value = "";
  errorMessage.value = "";
}

function toggleTheme() {
  colorMode.preference = isDark.value ? "light" : "dark";
}

function onDragEnter(event: DragEvent) {
  if (!event.dataTransfer?.types.includes("Files")) return;
  dragDepth.value++;
  isDragging.value = true;
}

function onDragLeave(event: DragEvent) {
  if (!event.dataTransfer?.types.includes("Files")) return;
  dragDepth.value = Math.max(0, dragDepth.value - 1);
  if (dragDepth.value === 0) isDragging.value = false;
}

function onDragOver(event: DragEvent) {
  if (!event.dataTransfer?.types.includes("Files")) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = "copy";
}

onMounted(() => {
  window.addEventListener("dragenter", onDragEnter);
  window.addEventListener("dragover", onDragOver);
  window.addEventListener("dragleave", onDragLeave);
  window.addEventListener("drop", handleDrop);
});

onBeforeUnmount(() => {
  window.removeEventListener("dragenter", onDragEnter);
  window.removeEventListener("dragover", onDragOver);
  window.removeEventListener("dragleave", onDragLeave);
  window.removeEventListener("drop", handleDrop);
});
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center px-4">
    <div
      v-show="isDragging"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none"
    >
      <div class="px-8 py-6 bg-default border border-default rounded-2xl text-center shadow-lg">
        <UIcon name="i-lucide-upload" class="w-8 h-8 mx-auto mb-3" />
        <p class="text-lg">{{ t("labels.drop_hint") }}</p>
      </div>
    </div>

    <div class="fixed top-4 right-4 flex items-center gap-2">
      <USelectMenu
        v-model="currentLocale"
        :items="localeItems"
        value-key="value"
        label-key="label"
        :search-input="false"
        size="sm"
        variant="soft"
      />
      <UButton
        icon="i-lucide-github"
        variant="ghost"
        color="neutral"
        to="https://github.com/jerryshell/pdf2json-online"
        target="_blank"
        rel="noopener noreferrer"
      />
      <UButton
        :icon="isDark ? 'i-lucide-sun' : 'i-lucide-moon'"
        variant="ghost"
        color="neutral"
        @click="toggleTheme"
      />
    </div>

    <div class="w-full max-w-2xl">
      <h1 class="text-5xl text-center mb-8 font-normal">
        <span style="color: #4285f4">P</span>
        <span style="color: #ea4335">D</span>
        <span style="color: #fbbc05">F </span>
        <span style="color: #34a853">J</span>
        <span style="color: #4285f4">S</span><span style="color: #ea4335">O</span>
        <span style="color: #fbbc05">N</span>
      </h1>

      <div
        class="text-center mb-8 transition-shadow"
        :class="{ 'ring-2 ring-black/10 dark:ring-white/10 rounded-full': isDragging }"
      >
        <label
          class="inline-flex items-center justify-center px-6 py-3 bg-default border border-default rounded-full cursor-pointer hover:bg-(--ui-bg-active) transition-colors"
        >
          <UIcon v-if="isConverting" name="i-lucide-loader-2" class="w-5 h-5 mr-2 animate-spin" />
          <UIcon v-else name="i-lucide-upload" class="w-5 h-5 mr-2" />
          <span class="text-base">
            {{
              isConverting ? t("labels.converting") : selectedFile?.name || t("labels.drop_hint")
            }}
          </span>
          <input type="file" accept=".pdf" class="hidden" @change="handleFileSelect" />
        </label>
      </div>

      <UAlert v-if="errorMessage" color="error" :title="errorMessage" class="mb-6" />

      <template v-if="jsonResult">
        <UTabs v-model="activeTab" :items="tabItems">
          <template #content="{ item }">
            <div v-if="item.value === 'result'" class="relative mt-4">
              <textarea
                v-model="jsonResult"
                class="w-full h-96 p-4 font-mono text-sm bg-default border border-default rounded-lg resize-none"
                readonly
              />
              <div class="absolute top-2 right-2 flex gap-2">
                <UButton size="sm" variant="soft" @click="copyJson">
                  <UIcon name="i-lucide-copy" class="w-4 h-4" />
                </UButton>
                <UButton size="sm" variant="soft" @click="downloadJson">
                  <UIcon name="i-lucide-download" class="w-4 h-4" />
                </UButton>
                <UButton size="sm" variant="soft" color="neutral" @click="reset">
                  <UIcon name="i-lucide-x" class="w-4 h-4" />
                </UButton>
              </div>
            </div>

            <div v-else class="mt-4 space-y-4">
              <p class="text-sm text-muted">{{ t("labels.api_intro") }}</p>
              <div class="relative">
                <pre
                  class="p-4 pr-12 bg-gray-900 text-green-400 rounded-lg text-sm overflow-x-auto"
                ><code><ClientOnly>{{ curlCommand }}</ClientOnly></code></pre>
                <UButton
                  size="sm"
                  variant="soft"
                  class="absolute top-2 right-2"
                  @click="copyApiCommand"
                >
                  <UIcon name="i-lucide-copy" class="w-4 h-4" />
                </UButton>
              </div>
            </div>
          </template>
        </UTabs>
      </template>

      <div v-else class="space-y-6">
        <div class="space-y-4">
          <p class="text-sm text-muted">{{ t("labels.api_short") }}</p>
          <div class="relative">
            <pre
              class="p-4 pr-12 bg-gray-900 text-green-400 rounded-lg text-sm overflow-x-auto"
            ><code><ClientOnly>{{ curlCommand }}</ClientOnly></code></pre>
            <UButton
              size="sm"
              variant="soft"
              class="absolute top-2 right-2"
              @click="copyApiCommand"
            >
              <UIcon name="i-lucide-copy" class="w-4 h-4" />
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
