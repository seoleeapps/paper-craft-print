import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  AppState,
  BackHandler,
  KeyboardAvoidingView,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as Picker from "expo-image-picker";
import * as Manipulator from "expo-image-manipulator";
import * as Localization from "expo-localization";
import { useFonts } from "expo-font";
import * as Splash from "expo-splash-screen";
import {
  CraftProject,
  Face,
  createProject,
  PATTERNS,
  FREE,
  layout,
} from "@paper-craft/product-core";
import {
  initialize,
  repository,
  duplicate,
  persistPhoto,
  cleanup,
  setting,
} from "./src/storage";
import { Preview, PagePreview } from "./src/Preview";
import { exportPDF, sharePDF, printPDF, saveExternal } from "./src/export";
import { privacy, rewards } from "./src/ads";
void Splash.preventAutoHideAsync();
type Screen = "home" | "list" | "edit" | "output" | "done" | "settings";
const words = {
  en: {
    new: "Create an envelope",
    title: "Your little paper studio",
    sub: "A photo. A note. Something to keep.",
    works: "My drafts",
    settings: "Settings",
    back: "Back",
    edit: "Make it yours",
    front: "Front",
    backFace: "Back",
    size: "Size · mm",
    text: "A short note",
    photo: "Choose photo",
    remove: "Remove photo",
    output: "Check print layout",
    save: "Create PDF",
    done: "Your PDF is ready",
    share: "Share PDF",
    external: "Save to a folder",
    print: "Print",
    paper: "Paper",
    repeat: "Repeat to fill page",
    single: "One envelope",
    delete: "Delete",
    copy: "Duplicate",
    language: "Language",
    privacy: "Ad privacy choices",
    unlock: "Watch an ad for this draft",
    estimate: "Inner space is an estimate. Test the assembled envelope.",
    legend: "Solid: cut · Dashed: fold · Hatched: glue",
    scale: "Print at 100% / Actual size. Measure the 50 mm line.",
    auto: "Saved on this device",
    saved: "Saved to your chosen folder",
    shared: "Share sheet opened",
    cancel: "Cancelled",
    loading: "Working…",
    empty: "Your next small creation starts here.",
    zoom: "Zoom",
    horizontal: "Move left / right",
    vertical: "Move up / down",
    note: "Up to 30 characters",
    failed: "Could not complete this action. Your draft is kept.",
    free: "Free",
    locked: "Ad unlock",
    patterns: {
      plain: "Plain",
      dots: "Dots",
      stripes: "Stripes",
      grid: "Grid",
      waves: "Waves",
      stars: "Stars",
      diamonds: "Diamonds",
    },
    offline:
      "Photos and drafts stay on this device. Deleting the app removes them.",
  },
  ko: {
    new: "봉투 만들기",
    title: "나만의 작은 종이 작업실",
    sub: "사진 한 장, 짧은 문구, 간직할 봉투.",
    works: "내 작업",
    settings: "설정",
    back: "뒤로",
    edit: "나만의 봉투 꾸미기",
    front: "앞면",
    backFace: "뒷면",
    size: "크기 · mm",
    text: "짧은 문구",
    photo: "사진 선택",
    remove: "사진 제거",
    output: "출력 배치 확인",
    save: "PDF 만들기",
    done: "PDF가 준비됐어요",
    share: "PDF 공유",
    external: "폴더에 저장",
    print: "인쇄",
    paper: "종이",
    repeat: "종이에 반복 배치",
    single: "봉투 하나",
    delete: "삭제",
    copy: "복제",
    language: "언어",
    privacy: "광고 개인정보 선택",
    unlock: "광고를 보고 이 작업에 사용",
    estimate: "내부 공간은 추정값이에요. 조립 후 확인해 주세요.",
    legend: "실선: 자르기 · 점선: 접기 · 빗금: 접착",
    scale: "100% 또는 실제 크기로 인쇄하고 50 mm 선을 재세요.",
    auto: "이 기기에 저장됨",
    saved: "선택한 폴더에 저장했어요",
    shared: "공유 창을 열었어요",
    cancel: "취소",
    loading: "처리 중…",
    empty: "작은 종이 작품을 시작해 보세요.",
    zoom: "확대",
    horizontal: "좌우 이동",
    vertical: "상하 이동",
    note: "30자까지 입력",
    failed: "완료하지 못했어요. 초안은 보관되어 있어요.",
    free: "무료",
    locked: "광고로 열기",
    patterns: {
      plain: "단색",
      dots: "점무늬",
      stripes: "줄무늬",
      grid: "격자",
      waves: "물결",
      stars: "별",
      diamonds: "마름모",
    },
    offline: "사진과 초안은 이 기기에만 보관돼요. 앱을 삭제하면 함께 삭제돼요.",
  },
};
function Button({
  children,
  onPress,
  primary = false,
  disabled = false,
  label,
}: {
  children: React.ReactNode;
  onPress: () => void;
  primary?: boolean;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessible
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        primary && s.primary,
        disabled && { opacity: 0.4 },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text style={[s.buttonText, primary && { color: "white" }]}>
        {children}
      </Text>
    </Pressable>
  );
}
const id = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export default function App() {
  const [fonts, fontError] = useFonts({
    CraftSans: require("./assets/fonts/CraftSans.ttf"),
  });
  const [ready, setReady] = useState(false),
    [screen, setScreen] = useState<Screen>("home"),
    [lang, setLang] = useState<"en" | "ko">(
      Localization.getLocales()[0]?.languageCode === "ko" ? "ko" : "en",
    ),
    [p, setP] = useState<CraftProject>(),
    [projects, setProjects] = useState<CraftProject[]>([]),
    [face, setFace] = useState<"front" | "back">("front"),
    [rights, setRights] = useState<string[]>([]),
    [paper, setPaper] = useState<"A4" | "Letter">("A4"),
    [repeat, setRepeat] = useState(false),
    [pdf, setPdf] = useState(""),
    [busy, setBusy] = useState(false),
    [draftSave, setDraftSave] = useState<"saved" | "saving" | "failed">(
      "saved",
    ),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [dimensions, setDimensions] = useState({ width: "80", height: "120" });
  const current = useRef(p);
  current.current = p;
  const scroll = useRef<ScrollView>(null);
  const scrollOffset = useRef(0);
  const inputs = useRef<Record<string, TextInput | null>>({});
  const focused = useRef<TextInput | null>(null);
  function revealInput() {
    requestAnimationFrame(() => {
      const input = focused.current,
        view = scroll.current;
      if (!input || !view) return;
      view
        .getNativeScrollRef()
        ?.measureInWindow(
          (_x: number, y: number, _w: number, height: number) => {
            input.measureInWindow((_ix, inputY, _iw, inputHeight) => {
              if (focused.current !== input || scroll.current !== view) return;
              const delta =
                inputY + inputHeight > y + height - 12
                  ? inputY + inputHeight - y - height + 12
                  : inputY < y + 12
                    ? inputY - y - 12
                    : 0;
              if (delta)
                view.scrollTo({
                  y: Math.max(0, scrollOffset.current + delta),
                  animated: true,
                });
            });
          },
        );
    });
  }
  function focusInput(key: string) {
    focused.current = inputs.current[key];
    if (Keyboard.isVisible()) revealInput();
  }
  function blurInput(key: string) {
    if (focused.current === inputs.current[key]) focused.current = null;
  }
  useEffect(() => {
    const sub = Keyboard.addListener("keyboardDidShow", revealInput);
    return () => sub.remove();
  }, []);
  const t = words[lang];
  const report = (e: unknown) => {
    const raw = e instanceof Error ? e.message : "";
    setError(
      raw.startsWith("TEXT:")
        ? lang === "ko"
          ? "문구가 너무 길거나 지원하지 않는 글자가 있어요. 문구를 줄여 주세요."
          : "Shorten your note or remove unsupported characters."
        : raw.startsWith("AD_") || raw === "CONSENT"
          ? lang === "ko"
            ? "광고를 이용할 수 없어요. 무료 패턴으로 계속 만들 수 있어요."
            : "Ad unavailable. You can continue with free patterns."
          : t.failed,
    );
  };
  async function run(fn: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await fn();
    } catch (e) {
      console.warn(
        "Craft action failed",
        e instanceof Error ? e.message : "unknown",
      );
      report(e);
    } finally {
      setBusy(false);
    }
  }
  async function boot() {
    setError("");
    try {
      await initialize();
      const value = await setting("language");
      if (value === "en" || value === "ko") setLang(value);
      setProjects(await repository.list());
      setReady(true);
    } catch (e) {
      report(e);
    }
  }
  useEffect(() => {
    void boot();
  }, []);
  useEffect(() => {
    if ((fonts && ready) || fontError || error) void Splash.hideAsync();
  }, [fonts, fontError, ready, error]);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active" && current.current)
        void repository.save(current.current).catch(report);
    });
    return () => sub.remove();
  }, []);
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (screen === "home") return false;
      setScreen(
        screen === "done" ? "output" : screen === "output" ? "edit" : "home",
      );
      return true;
    });
    return () => sub.remove();
  }, [screen]);
  async function saveDraft(project: CraftProject) {
    setDraftSave("saving");
    try {
      await repository.save(project);
      if (current.current === project) setDraftSave("saved");
    } catch {
      setDraftSave("failed");
      setError(
        lang === "ko"
          ? "자동 저장에 실패했어요. 앱을 종료하기 전에 다시 저장해 주세요."
          : "Autosave failed. Save again before closing the app.",
      );
    }
  }
  function update(changes: Partial<CraftProject>) {
    if (!p) return;
    const next = {
      ...(current.current || p),
      ...changes,
      updatedAt: Date.now(),
    };
    setP(next);
    current.current = next;
    setMessage("");
    void saveDraft(next);
  }
  async function open(project: CraftProject) {
    setP(project);
    current.current = project;
    setDraftSave("saved");
    setDimensions({
      width: String(project.width),
      height: String(project.height),
    });
    setRights(await repository.rights(project.id));
    setError("");
    setScreen("edit");
  }
  async function choosePhoto() {
    if (!p) return;
    const result = await Picker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
    });
    if (result.canceled) return;
    const a = result.assets[0];
    const image = await Manipulator.ImageManipulator.manipulate(
      a.uri,
    ).renderAsync();
    const normalized = await image.saveAsync({
      format: Manipulator.SaveFormat.JPEG,
      compress: 0.95,
    });
    const uri = persistPhoto(normalized.uri);
    update({
      [face]: {
        ...p[face],
        photo: {
          uri,
          width: normalized.width,
          height: normalized.height,
          zoom: 1,
          x: 0.5,
          y: 0.5,
        },
      },
    });
  }
  function changeDimension(key: "width" | "height", value: string) {
    setDimensions((d) => ({ ...d, [key]: value }));
    const n = Number(value);
    if (
      Number.isFinite(n) &&
      n >= (key === "width" ? 40 : 60) &&
      n <= (key === "width" ? 85 : 160)
    )
      update({ [key]: n });
  }
  const valid =
    p &&
    Number(dimensions.width) === p.width &&
    Number(dimensions.height) === p.height;
  function adjustPhoto(key: "zoom" | "x" | "y", delta: number) {
    if (!p?.[face].photo) return;
    const photo = p[face].photo!;
    update({
      [face]: {
        ...p[face],
        photo: {
          ...photo,
          [key]: Math.max(
            key === "zoom" ? 1 : 0,
            Math.min(key === "zoom" ? 4 : 1, photo[key] + delta),
          ),
        },
      },
    });
  }
  if (!ready || !fonts) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={s.root}>
          <Text style={s.title}>Paper Craft Print</Text>
          {error || fontError ? (
            <View>
              <Text accessibilityRole="alert">
                {error || String(fontError)}
              </Text>
              {!fontError ? (
                <Button onPress={() => void boot()}>
                  {lang === "ko" ? "다시 시도" : "Try again"}
                </Button>
              ) : null}
            </View>
          ) : (
            <ActivityIndicator />
          )}
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }
  const title =
    screen === "home"
      ? t.title
      : screen === "edit"
        ? t.edit
        : screen === "output"
          ? t.output
          : screen === "done"
            ? t.done
            : screen === "list"
              ? t.works
              : t.settings;
  return (
    <SafeAreaProvider>
      <SafeAreaView style={s.root}>
        <StatusBar style="dark" />
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="height">
          <View style={s.header}>
            {screen !== "home" ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t.back}
                onPress={() => {
                  setError("");
                  setScreen(
                    screen === "output"
                      ? "edit"
                      : screen === "done"
                        ? "output"
                        : "home",
                  );
                }}
                style={{ paddingVertical: 12 }}
              >
                <Text style={s.link}>‹ {t.back}</Text>
              </Pressable>
            ) : (
              <Text style={s.brand}>PAPER CRAFT PRINT</Text>
            )}
            <Text accessibilityRole="header" style={s.title}>
              {title}
            </Text>
          </View>
          <ScrollView
            ref={scroll}
            onScroll={(event) => {
              scrollOffset.current = event.nativeEvent.contentOffset.y;
            }}
            scrollEventThrottle={16}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={s.content}
          >
            {screen === "home" ? (
              <>
                <Text style={s.sub}>{t.sub}</Text>
                <Preview project={createProject("sample")} />
                <Text style={s.sub}>{t.empty}</Text>
                <View style={s.row}>
                  <Button
                    onPress={() =>
                      void run(async () => {
                        setProjects(await repository.list());
                        setScreen("list");
                      })
                    }
                  >
                    {t.works}
                  </Button>
                  <Button onPress={() => setScreen("settings")}>
                    {t.settings}
                  </Button>
                </View>
              </>
            ) : null}
            {screen === "list" ? (
              <>
                {projects.length === 0 ? (
                  <Text style={s.sub}>{t.empty}</Text>
                ) : (
                  projects.map((project) => (
                    <View key={project.id} style={s.card}>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => void run(() => open(project))}
                      >
                        <Text style={s.section}>
                          {project.name ||
                            `${project.width} × ${project.height} mm`}
                        </Text>
                        <Text style={s.sub}>
                          {new Date(project.updatedAt).toLocaleDateString(lang)}{" "}
                          · {project.front.text || t.patterns[project.pattern]}
                        </Text>
                      </Pressable>
                      <View style={s.row}>
                        <Button
                          onPress={() =>
                            void run(async () => {
                              await duplicate(project, id());
                              setProjects(await repository.list());
                            })
                          }
                        >
                          {t.copy}
                        </Button>
                        <Button
                          onPress={() =>
                            Alert.alert(
                              t.delete,
                              lang === "ko"
                                ? "이 초안과 연결된 사진을 삭제할까요?"
                                : "Delete this draft and unreferenced photos?",
                              [
                                { text: t.cancel, style: "cancel" },
                                {
                                  text: t.delete,
                                  style: "destructive",
                                  onPress: () =>
                                    void run(async () => {
                                      await repository.remove(project.id);
                                      if (p?.id === project.id) setP(undefined);
                                      await cleanup();
                                      setProjects(await repository.list());
                                    }),
                                },
                              ],
                            )
                          }
                        >
                          {t.delete}
                        </Button>
                      </View>
                    </View>
                  ))
                )}
              </>
            ) : null}
            {screen === "edit" && p ? (
              <>
                <View style={s.row}>
                  <Button onPress={() => setFace("front")}>
                    {face === "front" ? "● " : ""}
                    {t.front}
                  </Button>
                  <Button onPress={() => setFace("back")}>
                    {face === "back" ? "● " : ""}
                    {t.backFace}
                  </Button>
                </View>
                <Preview project={p} faceOnly={face} />
                <Text style={s.section}>{t.size}</Text>
                <View style={s.row}>
                  {[
                    [60, 90],
                    [80, 120],
                    [85, 150],
                  ].map(([w, h]) => (
                    <Button
                      key={w}
                      onPress={() => {
                        setDimensions({ width: String(w), height: String(h) });
                        update({ width: w, height: h });
                      }}
                    >
                      {w}×{h}
                    </Button>
                  ))}
                </View>
                <View style={s.row}>
                  {(["width", "height"] as const).map((key) => (
                    <View key={key} style={{ flex: 1 }}>
                      <Text style={s.sub}>
                        {key === "width"
                          ? lang === "ko"
                            ? "폭 40–85"
                            : "Width 40–85"
                          : lang === "ko"
                            ? "높이 60–160"
                            : "Height 60–160"}
                      </Text>
                      <TextInput
                        ref={(input) => {
                          inputs.current[key] = input;
                        }}
                        onFocus={() => focusInput(key)}
                        onBlur={() => blurInput(key)}
                        accessibilityLabel={
                          key === "width"
                            ? lang === "ko"
                              ? "폭 밀리미터"
                              : "Width mm"
                            : lang === "ko"
                              ? "높이 밀리미터"
                              : "Height mm"
                        }
                        style={s.input}
                        value={dimensions[key]}
                        keyboardType="decimal-pad"
                        onChangeText={(v) => changeDimension(key, v)}
                      />
                    </View>
                  ))}
                </View>
                {!valid ? (
                  <Text accessibilityRole="alert" style={s.error}>
                    {lang === "ko"
                      ? "허용 범위의 크기를 입력해 주세요."
                      : "Enter a size within the shown range."}
                  </Text>
                ) : null}
                <Text style={s.sub}>
                  ≈ {p.width - p.tab} × {p.height - 2 * p.tab} mm · {t.estimate}
                </Text>
                <Text style={s.section}>{t.text}</Text>
                <TextInput
                  ref={(input) => {
                    inputs.current.note = input;
                  }}
                  onFocus={() => focusInput("note")}
                  onBlur={() => blurInput("note")}
                  accessibilityLabel={`${face === "front" ? t.front : t.backFace} ${t.text}`}
                  placeholder={t.note}
                  maxLength={30}
                  style={s.input}
                  value={p[face].text}
                  onChangeText={(text) =>
                    update({
                      [face]: { ...p[face], text: text.normalize("NFC") },
                    })
                  }
                />
                <Text style={s.sub}>{Array.from(p[face].text).length}/30</Text>
                <Button onPress={() => void run(choosePhoto)}>{t.photo}</Button>
                {p[face].photo ? (
                  <>
                    <Button
                      onPress={() => update({ [face]: { text: p[face].text } })}
                    >
                      {t.remove}
                    </Button>
                    {(["zoom", "x", "y"] as const).map((key) => (
                      <View key={key} style={s.row}>
                        <Text style={[s.sub, { flex: 1 }]}>
                          {key === "zoom"
                            ? t.zoom
                            : key === "x"
                              ? t.horizontal
                              : t.vertical}
                        </Text>
                        <Button
                          label={`${key === "zoom" ? t.zoom : key === "x" ? t.horizontal : t.vertical} ${lang === "ko" ? "줄이기" : "decrease"}`}
                          onPress={() =>
                            adjustPhoto(key, -(key === "zoom" ? 0.25 : 0.1))
                          }
                        >
                          −
                        </Button>
                        <Text style={s.sub}>
                          {p[face].photo![key].toFixed(1)}
                        </Text>
                        <Button
                          label={`${key === "zoom" ? t.zoom : key === "x" ? t.horizontal : t.vertical} ${lang === "ko" ? "늘리기" : "increase"}`}
                          onPress={() =>
                            adjustPhoto(key, key === "zoom" ? 0.25 : 0.1)
                          }
                        >
                          +
                        </Button>
                      </View>
                    ))}
                  </>
                ) : null}
                <Text style={s.section}>
                  {lang === "ko" ? "패턴" : "Pattern"}
                </Text>
                <View style={s.wrap}>
                  {PATTERNS.map((pattern) => (
                    <Button
                      key={pattern}
                      onPress={() =>
                        void run(async () => {
                          if (
                            !FREE.includes(pattern) &&
                            !rights.includes(pattern)
                          ) {
                            await new Promise<void>((resolve, reject) =>
                              Alert.alert(
                                t.unlock,
                                `${t.patterns[pattern]} · ${lang === "ko" ? "보상은 이 초안에 저장돼요." : "Reward is saved to this draft."}`,
                                [
                                  {
                                    text: t.cancel,
                                    onPress: () =>
                                      reject(new Error("AD_CANCELLED")),
                                    style: "cancel",
                                  },
                                  { text: t.unlock, onPress: () => resolve() },
                                ],
                                { cancelable: false },
                              ),
                            );
                            await repository.save(p);
                            await rewards.unlock(p.id, pattern);
                            setRights(await repository.rights(p.id));
                          }
                          update({ pattern });
                        })
                      }
                    >
                      {p.pattern === pattern ? "● " : ""}
                      {t.patterns[pattern]} ·{" "}
                      {FREE.includes(pattern) || rights.includes(pattern)
                        ? t.free
                        : t.locked}
                    </Button>
                  ))}
                </View>
                <Text accessibilityLiveRegion="polite" style={s.sub}>
                  {draftSave === "saved"
                    ? t.auto
                    : draftSave === "saving"
                      ? t.loading
                      : lang === "ko"
                        ? "아직 저장되지 않았어요."
                        : "Changes have not been saved."}
                </Text>
                {draftSave === "failed" ? (
                  <Button onPress={() => void saveDraft(p)}>
                    {lang === "ko" ? "다시 저장" : "Save again"}
                  </Button>
                ) : null}
              </>
            ) : null}
            {screen === "output" && p ? (
              <>
                <PagePreview project={p} paper={paper} repeat={repeat} />
                <Text style={s.sub}>{t.legend}</Text>
                <Text style={s.section}>{t.paper}</Text>
                <View style={s.row}>
                  {(["A4", "Letter"] as const).map((v) => (
                    <Button key={v} onPress={() => setPaper(v)}>
                      {paper === v ? "● " : ""}
                      {v}
                    </Button>
                  ))}
                </View>
                <Button onPress={() => setRepeat((v) => !v)}>
                  {repeat ? "● " : ""}
                  {t.repeat}
                </Button>
                <Text style={s.section}>
                  {layout(p, paper, repeat).copies} × {p.width} × {p.height} mm
                </Text>
                <Text style={s.sub}>{t.scale}</Text>
              </>
            ) : null}
            {screen === "done" ? (
              <>
                <Text style={s.check}>✓</Text>
                <Text style={s.sub}>{t.auto}</Text>
                <Button
                  onPress={() =>
                    void run(async () => {
                      await sharePDF(pdf);
                      setMessage(t.shared);
                    })
                  }
                >
                  {t.share}
                </Button>
                <Button
                  onPress={() =>
                    void run(async () => {
                      await printPDF(pdf);
                    })
                  }
                >
                  {t.print}
                </Button>
                <Text style={s.sub}>{t.scale}</Text>
              </>
            ) : null}
            {screen === "settings" ? (
              <>
                <Text style={s.section}>{t.language}</Text>
                <View style={s.row}>
                  {(["en", "ko"] as const).map((v) => (
                    <Button
                      key={v}
                      onPress={() =>
                        void run(async () => {
                          await setting("language", v);
                          setLang(v);
                        })
                      }
                    >
                      {lang === v ? "● " : ""}
                      {v === "en" ? "English" : "한국어"}
                    </Button>
                  ))}
                </View>
                <Button
                  onPress={() =>
                    void run(async () => {
                      const available = await privacy();
                      if (!available)
                        setMessage(
                          lang === "ko"
                            ? "현재 지역에는 추가 광고 동의 선택이 없어요."
                            : "No additional ad consent choices are required in this region.",
                        );
                    })
                  }
                >
                  {t.privacy}
                </Button>
                <Text style={s.sub}>{t.offline}</Text>
                <Text style={s.sub}>
                  {lang === "ko"
                    ? "선택한 광고를 시청하면 이 초안에 추가 패턴이 열려요. 광고 SDK는 광고·동의 처리를 위해 데이터를 전송할 수 있어요."
                    : "Optional rewarded ads unlock patterns for this draft. The ads SDK may send data for advertising and consent."}
                </Text>
                <Text style={s.sub}>
                  Noto Sans KR · SIL Open Font License 1.1
                </Text>
              </>
            ) : null}
            {error ? (
              <Text accessibilityRole="alert" style={s.error}>
                {error}
              </Text>
            ) : null}
            {message ? (
              <Text accessibilityLiveRegion="polite" style={s.success}>
                {message}
              </Text>
            ) : null}
          </ScrollView>
          {busy ? <ActivityIndicator style={{ padding: 8 }} /> : null}
          <View style={s.footer}>
            {screen === "home" || screen === "list" ? (
              <Button
                primary
                disabled={busy}
                onPress={() =>
                  void run(async () => {
                    const project = createProject(id());
                    await repository.save(project);
                    await open(project);
                  })
                }
              >
                {t.new}
              </Button>
            ) : screen === "edit" ? (
              <Button
                primary
                disabled={busy || !valid}
                onPress={() => {
                  setError("");
                  setScreen("output");
                }}
              >
                {t.output}
              </Button>
            ) : screen === "output" && p ? (
              <Button
                primary
                disabled={busy}
                onPress={() =>
                  void run(async () => {
                    await repository.save(p);
                    setPdf(await exportPDF(p, paper, repeat));
                    setScreen("done");
                  })
                }
              >
                {t.save}
              </Button>
            ) : screen === "done" ? (
              <Button
                primary
                disabled={busy}
                onPress={() =>
                  void run(async () => {
                    setMessage((await saveExternal(pdf)) ? t.saved : t.cancel);
                  })
                }
              >
                {t.external}
              </Button>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#faf7f0" },
  header: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 12 },
  brand: {
    fontSize: 11,
    letterSpacing: 2,
    color: "#60766e",
    fontWeight: "700",
    marginBottom: 18,
  },
  title: { fontSize: 28, color: "#273e36", fontWeight: "700" },
  content: { paddingHorizontal: 22, paddingBottom: 24 },
  sub: { fontSize: 14, lineHeight: 22, color: "#65766c", marginVertical: 6 },
  section: {
    fontSize: 17,
    color: "#273e36",
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  row: { flexDirection: "row", gap: 8, alignItems: "center", flexWrap: "wrap" },
  wrap: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  button: {
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#eeeee5",
    marginVertical: 4,
  },
  primary: { backgroundColor: "#2e5b48" },
  buttonText: {
    fontSize: 15,
    color: "#2e5043",
    fontWeight: "600",
    textAlign: "center",
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: "#c2ccbe",
    borderRadius: 12,
    padding: 12,
    fontSize: 17,
    color: "#273e36",
    backgroundColor: "white",
  },
  footer: {
    paddingHorizontal: 22,
    paddingBottom: 8,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#e5e7db",
  },
  card: {
    padding: 16,
    backgroundColor: "white",
    borderRadius: 16,
    marginVertical: 8,
  },
  error: { color: "#963d27", fontSize: 15, lineHeight: 23, marginVertical: 10 },
  success: { color: "#2e5b48", fontSize: 15, marginVertical: 10 },
  link: { color: "#2e5b48", fontSize: 16 },
  check: {
    fontSize: 84,
    textAlign: "center",
    color: "#2e5b48",
    marginVertical: 35,
  },
});
