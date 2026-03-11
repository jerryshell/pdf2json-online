<script setup lang="ts">
const { t, locale, locales, setLocale } = useI18n();

const seoTitle = computed(() => t("seo.title"));
const seoDescription = computed(() => t("seo.description"));

useSeoMeta({
  title: seoTitle,
  description: seoDescription,
  ogTitle: seoTitle,
  ogDescription: seoDescription,
  ogImage: "/favicon.ico",
  twitterCard: "summary",
});

const colorMode = useColorMode();
const toast = useToast();
const requestUrl = useRequestURL();

const selectedFile = ref<File | null>(null);
const jsonText = ref("");
const isConverting = ref(false);
const errorText = ref("");
const activeTab = ref("result");
const isDragActive = ref(false);
const dragDepth = ref(0);

const apiUrl = computed(() => new URL("/api/convert", requestUrl.origin).toString());
const apiCommand = computed(() => `curl -X POST -F "file=@your.pdf" ${apiUrl.value}`);

const tabItems = computed(() => [
  { label: t("tabs.result"), value: "result" },
  { label: t("tabs.api"), value: "api" },
]);

const isDark = computed(() => colorMode.value === "dark");

const currentLocale = computed({
  get() {
    return locale.value;
  },
  set(value) {
    if (typeof value === "string") {
      void setLocale(value);
    }
  },
});

const localeItems = computed(() =>
  locales.value.map((item) => {
    if (typeof item === "string") {
      return { label: item, value: item };
    }

    return { label: item.name || item.code, value: item.code };
  }),
);

async function convertPdfToJson() {
  if (!selectedFile.value) return;

  isConverting.value = true;
  clearResult();

  try {
    const formData = new FormData();
    formData.append("file", selectedFile.value);

    const data = await $fetch(apiUrl.value, {
      method: "POST",
      body: formData,
    });

    jsonText.value = JSON.stringify(data, null, 2);
  } catch (error: unknown) {
    errorText.value = error instanceof Error ? error.message : t("messages.conversion_failed");
  } finally {
    isConverting.value = false;
  }
}

function downloadResultJson() {
  if (!jsonText.value) return;

  const blob = new Blob([jsonText.value], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = selectedFile.value?.name.replace(".pdf", ".json") || "result.json";
  anchor.click();
  URL.revokeObjectURL(url);
}

function copyResultJson() {
  if (!jsonText.value) return;
  void navigator.clipboard.writeText(jsonText.value);
  toast.add({ title: t("messages.copied") });
}

function copyApiCurl() {
  void navigator.clipboard.writeText(apiCommand.value);
  toast.add({ title: t("messages.copied") });
}

function resetForm() {
  selectedFile.value = null;
  clearResult();
}

function toggleColorMode() {
  colorMode.preference = isDark.value ? "light" : "dark";
}

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files?.[0]) {
    setSelectedFile(target.files[0]);
  }
}

function onWindowDragEnter(event: DragEvent) {
  if (!isFileDragEvent(event)) return;
  dragDepth.value += 1;
  isDragActive.value = true;
}

function onWindowDragOver(event: DragEvent) {
  if (!isFileDragEvent(event)) return;
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "copy";
  }
  isDragActive.value = true;
}

function onWindowDragLeave(event: DragEvent) {
  if (!isFileDragEvent(event)) return;
  dragDepth.value = Math.max(0, dragDepth.value - 1);
  if (dragDepth.value === 0) {
    isDragActive.value = false;
  }
}

function onWindowDrop(event: DragEvent) {
  if (!isFileDragEvent(event)) return;
  event.preventDefault();
  dragDepth.value = 0;
  isDragActive.value = false;
  const droppedFile = event.dataTransfer?.files?.[0];
  if (droppedFile) {
    setSelectedFile(droppedFile);
  }
}

function setSelectedFile(newFile: File) {
  if (!isPdfFile(newFile)) {
    errorText.value = t("messages.invalid_file");
    return;
  }

  selectedFile.value = newFile;
  clearResult();
  convertPdfToJson();
}

function isPdfFile(file: File) {
  const name = file.name.toLowerCase();
  return file.type === "application/pdf" || name.endsWith(".pdf");
}

function isFileDragEvent(event: DragEvent) {
  const types = event.dataTransfer?.types;
  return types ? Array.from(types).includes("Files") : false;
}

function clearResult() {
  jsonText.value = "";
  errorText.value = "";
}

onMounted(() => {
  window.addEventListener("dragenter", onWindowDragEnter);
  window.addEventListener("dragover", onWindowDragOver);
  window.addEventListener("dragleave", onWindowDragLeave);
  window.addEventListener("drop", onWindowDrop);
});

onBeforeUnmount(() => {
  window.removeEventListener("dragenter", onWindowDragEnter);
  window.removeEventListener("dragover", onWindowDragOver);
  window.removeEventListener("dragleave", onWindowDragLeave);
  window.removeEventListener("drop", onWindowDrop);
});
</script>

<template>
  <div class="min-h-screen flex flex-col items-center px-4 pt-20">
    <div
      v-show="isDragActive"
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
        aria-label="GitHub"
      />
      <UButton
        :icon="isDark ? 'i-lucide-sun' : 'i-lucide-moon'"
        variant="ghost"
        color="neutral"
        @click="toggleColorMode"
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
        :class="{ 'ring-2 ring-black/10 dark:ring-white/10 rounded-full': isDragActive }"
      >
        <label
          class="inline-flex items-center justify-center px-6 py-3 bg-default border border-default rounded-full cursor-pointer hover:bg-(--ui-bg-active) transition-colors"
        >
          <UIcon v-if="isConverting" name="i-lucide-loader-2" class="w-5 h-5 mr-2 animate-spin" />
          <UIcon v-else name="i-lucide-upload" class="w-5 h-5 mr-2" />
          <span class="text-base">{{
            isConverting ? t("labels.converting") : selectedFile?.name || t("labels.drop_hint")
          }}</span>
          <input type="file" accept=".pdf" class="hidden" @change="onFileChange" />
        </label>
      </div>

      <div v-if="errorText" class="mb-6">
        <UAlert color="error" :title="errorText" />
      </div>

      <div v-if="jsonText" class="space-y-4">
        <UTabs v-model="activeTab" :items="tabItems">
          <template #content="{ item }">
            <div v-if="item.value === 'result'" class="relative mt-4">
              <textarea
                v-model="jsonText"
                class="w-full h-96 p-4 font-mono text-sm bg-default border border-default rounded-lg resize-none"
                readonly
              />
              <div class="absolute top-2 right-2 flex gap-2">
                <UButton size="sm" variant="soft" @click="copyResultJson">
                  <UIcon name="i-lucide-copy" class="w-4 h-4" />
                </UButton>
                <UButton size="sm" variant="soft" @click="downloadResultJson">
                  <UIcon name="i-lucide-download" class="w-4 h-4" />
                </UButton>
                <UButton size="sm" variant="soft" color="neutral" @click="resetForm">
                  <UIcon name="i-lucide-x" class="w-4 h-4" />
                </UButton>
              </div>
            </div>

            <div v-else class="mt-4 space-y-4">
              <p class="text-sm text-muted">
                {{ t("labels.api_intro") }}
              </p>
              <div class="relative">
                <pre
                  class="p-4 pr-12 bg-gray-900 text-green-400 rounded-lg text-sm overflow-x-auto"
                ><code><ClientOnly>{{ apiCommand }}</ClientOnly></code></pre>
                <UButton
                  size="sm"
                  variant="soft"
                  class="absolute top-2 right-2"
                  @click="copyApiCurl"
                >
                  <UIcon name="i-lucide-copy" class="w-4 h-4" />
                </UButton>
              </div>
            </div>
          </template>
        </UTabs>
      </div>

      <div v-else class="space-y-6">
        <div class="space-y-4">
          <p class="text-sm text-muted">{{ t("labels.api_short") }}</p>
          <div class="relative">
            <pre
              class="p-4 pr-12 bg-gray-900 text-green-400 rounded-lg text-sm overflow-x-auto"
            ><code><ClientOnly>{{ apiCommand }}</ClientOnly></code></pre>
            <UButton size="sm" variant="soft" class="absolute top-2 right-2" @click="copyApiCurl">
              <UIcon name="i-lucide-copy" class="w-4 h-4" />
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
