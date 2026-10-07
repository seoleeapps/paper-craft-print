import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, {
  Rect,
  Line,
  Text as SvgText,
  Defs,
  Circle,
  Image,
  ClipPath,
  G,
} from "react-native-svg";
import {
  CraftProject,
  Rect as RectArea,
  net,
  photoCrop,
  patternMarks,
  layout,
  sizeLabel,
} from "@paper-craft/product-core";
const MM = 72 / 25.4;
function PatternFill({
  project: p,
  r,
}: {
  project: CraftProject;
  r: RectArea;
}) {
  return (
    <>
      <Rect {...r} fill="#f5efe0" />
      {patternMarks(p.pattern, r).map((mark, i) =>
        mark.kind === "dot" ? (
          <Circle key={i} cx={mark.x} cy={mark.y} r={mark.r} fill="#85a6a1" />
        ) : (
          <Line key={i} {...mark} stroke="#85a6a1" strokeWidth={0.5 / MM} />
        ),
      )}
    </>
  );
}
function Net({ project: p }: { project: CraftProject }) {
  const g = net(p),
    clip = (face: "front" | "back") => `${p.kind}-${face}`;
  return (
    <G>
      <Defs>
        {(["front", "back"] as const).map((face) => (
          <ClipPath key={face} id={clip(face)}>
            <Rect {...g.faces[face]} />
          </ClipPath>
        ))}
      </Defs>
      {g.panels.map((r, i) => (
        <PatternFill key={i} project={p} r={r} />
      ))}
      {(["front", "back"] as const).map((face) => {
        const r = g.faces[face],
          f = p[face],
          c = f.photo ? photoCrop(f.photo, r.width, r.height) : null;
        return (
          <G key={face} clipPath={`url(#${clip(face)})`}>
            {f.photo && c ? (
              <Image
                href={{ uri: f.photo.uri }}
                x={r.x - (c.x * r.width) / c.width}
                y={r.y - (c.y * r.height) / c.height}
                width={(f.photo.width * r.width) / c.width}
                height={(f.photo.height * r.height) / c.height}
                preserveAspectRatio="none"
              />
            ) : (
              <PatternFill project={p} r={r} />
            )}
            {f.text ? (
              <>
                <Rect
                  x={r.x + 3}
                  y={r.y + r.height - 15}
                  width={r.width - 6}
                  height="12"
                  fill="white"
                />
                <SvgText
                  x={r.x + r.width / 2}
                  y={r.y + r.height - 7}
                  fontFamily="CraftSans"
                  fontSize={11 / MM}
                  textAnchor="middle"
                  fill="#2e4040"
                >
                  {f.text}
                </SvgText>
              </>
            ) : null}
          </G>
        );
      })}
      {g.glue.map((r, i) => (
        <G key={i}>
          <Rect {...r} fill="#e5ebe5" />
          {Array.from({ length: Math.ceil(r.height / 3) }, (_, j) => (
            <Line
              key={j}
              x1={r.x}
              y1={r.y + j * 3}
              x2={Math.min(r.x + r.width, r.x + 3)}
              y2={Math.min(r.y + r.height, r.y + j * 3 + 3)}
              stroke="#85a6a1"
              strokeWidth={0.5 / MM}
            />
          ))}
          <SvgText
            x={r.x + 2}
            y={r.y + Math.min(r.height - 2, 6)}
            fontSize={6 / MM}
            fill="#2e4040"
          >
            {r.width <= 10 ? "G" : "GLUE"}
          </SvgText>
        </G>
      ))}
      {g.lines.map((l, i) => (
        <Line
          key={i}
          {...l}
          stroke="#2e4040"
          strokeWidth={0.5 / MM}
          strokeDasharray={
            l.kind === "fold" ? `${3 / MM} ${2 / MM}` : undefined
          }
        />
      ))}
    </G>
  );
}
export function Preview({
  project,
  faceOnly,
  compact = false,
}: {
  project: CraftProject;
  faceOnly?: "front" | "back";
  compact?: boolean;
}) {
  const g = net(project),
    bounds = faceOnly
      ? g.faces[faceOnly]
      : { x: 0, y: 0, width: g.width, height: g.height };
  return (
    <View
      accessible
      accessibilityLabel={`${sizeLabel(project)} mm, ${project.pattern}. ${project.front.text} ${project.back.text}`}
      style={[s.wrap, compact && s.compact]}
    >
      <Svg
        width="100%"
        height={faceOnly ? 240 : compact ? 110 : 210}
        viewBox={`${bounds.x - 2} ${bounds.y - 2} ${bounds.width + 4} ${bounds.height + 4}`}
      >
        <Defs>
          <ClipPath id="preview-face-bounds">
            <Rect {...bounds} />
          </ClipPath>
        </Defs>
        <G clipPath={faceOnly ? "url(#preview-face-bounds)" : undefined}>
          <Net project={project} />
        </G>
      </Svg>
      {!faceOnly && !compact ? (
        <Text style={s.legend}>✂ ━ · - - · ///</Text>
      ) : null}
    </View>
  );
}
export function PagePreview({
  project,
  paper,
  repeat,
}: {
  project: CraftProject;
  paper: "A4" | "Letter";
  repeat: boolean;
}) {
  const l = layout(project, paper, repeat),
    g = l.net;
  return (
    <View
      accessible
      accessibilityLabel={`${paper}, ${l.copies} copies, 100%, 50 mm calibration`}
      style={s.wrap}
    >
      <Svg width="100%" height={280} viewBox={`0 0 ${l.width} ${l.height}`}>
        <Rect x={0} y={0} width={l.width} height={l.height} fill="white" />
        <Rect
          x={10}
          y={10}
          width={l.width - 20}
          height={l.height - 20}
          fill="none"
          stroke="#b4c1b9"
          strokeWidth={0.3}
          strokeDasharray="1 2"
        />
        {l.placements.map((pos, i) => {
          const bottom = pos.y + (l.rotated ? g.width : g.height);
          return (
            <G key={i}>
              <G
                transform={
                  l.rotated
                    ? `translate(${pos.x + g.height} ${pos.y}) rotate(90)`
                    : `translate(${pos.x} ${pos.y})`
                }
              >
                <Net project={project} />
              </G>
              <SvgText
                x={pos.x}
                y={bottom + 5}
                fontSize={7 / MM}
                fill="#2e4040"
              >
                Cut ━ Fold - - Glue /// · Print at 100%
              </SvgText>
              <Line
                x1={pos.x}
                y1={bottom + 11}
                x2={pos.x + 50}
                y2={bottom + 11}
                stroke="#2e4040"
                strokeWidth={0.7 / MM}
              />
              <SvgText
                x={pos.x + 52}
                y={bottom + 12}
                fontSize={7 / MM}
                fill="#2e4040"
              >
                50 mm
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}
const s = StyleSheet.create({
  wrap: {
    backgroundColor: "#ece5d7",
    padding: 16,
    borderRadius: 18,
    marginVertical: 12,
  },
  compact: { padding: 10, marginVertical: 0 },
  legend: { textAlign: "center", color: "#536762", marginTop: 8 },
});
