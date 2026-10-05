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
  geometry,
  photoCrop,
  patternMarks,
  layout,
} from "@paper-craft/product-core";
function Net({ project: p }: { project: CraftProject }) {
  const g = geometry(p.width, p.height, p.tab);
  return (
    <G>
      {" "}
      <Defs>
        {(["front", "back"] as const).map((face) => (
          <ClipPath key={face} id={face}>
            <Rect {...g[face]} />
          </ClipPath>
        ))}
      </Defs>
      {(["front", "back"] as const).map((face) => {
        const r = g[face],
          f = p[face],
          c = f.photo ? photoCrop(f.photo, p.width, p.height) : null;
        return (
          <G key={face} clipPath={`url(#${face})`}>
            <Rect {...r} fill="#f5efe0" />
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
              patternMarks(p.pattern, r).map((mark, i) =>
                mark.kind === "dot" ? (
                  <Circle
                    key={i}
                    cx={mark.x}
                    cy={mark.y}
                    r={mark.r}
                    fill="#85a6a1"
                  />
                ) : (
                  <Line
                    key={i}
                    {...mark}
                    stroke="#85a6a1"
                    strokeWidth={0.5 / (72 / 25.4)}
                  />
                ),
              )
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
                  fontSize={11 / (72 / 25.4)}
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
              strokeWidth={0.5 / (72 / 25.4)}
            />
          ))}
          <SvgText
            x={r.x + 2}
            y={r.y + Math.min(r.height - 2, 6)}
            fontSize={6 / (72 / 25.4)}
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
          strokeWidth={0.5 / (72 / 25.4)}
          strokeDasharray={
            l.kind === "fold"
              ? `${3 / (72 / 25.4)} ${2 / (72 / 25.4)}`
              : undefined
          }
        />
      ))}
    </G>
  );
}
export function Preview({
  project,
  faceOnly,
}: {
  project: CraftProject;
  faceOnly?: "front" | "back";
}) {
  const g = geometry(project.width, project.height, project.tab),
    bounds = faceOnly
      ? g[faceOnly]
      : { x: 0, y: 0, width: g.width, height: g.height };
  return (
    <View
      accessible
      accessibilityLabel={`${project.width} × ${project.height} mm, ${project.pattern}. ${project.front.text} ${project.back.text}`}
      style={s.wrap}
    >
      <Svg
        width="100%"
        height={faceOnly ? 240 : 210}
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
      {!faceOnly ? <Text style={s.legend}>✂ ━ · - - · ///</Text> : null}
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
    g = l.geometry;
  return (
    <View
      accessible
      accessibilityLabel={`${paper}, ${l.copies} envelopes, 100%, 50 mm calibration`}
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
                fontSize={7 / (72 / 25.4)}
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
                strokeWidth={0.7 / (72 / 25.4)}
              />
              <SvgText
                x={pos.x + 52}
                y={bottom + 12}
                fontSize={7 / (72 / 25.4)}
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
  legend: { textAlign: "center", color: "#536762", marginTop: 8 },
});
