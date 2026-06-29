// src/screens/Statistiques.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Dimensions, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Polyline, Path, Line, Text as SvgText, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getHistory } from '../api/sensors';

const { width } = Dimensions.get('window');
const CARD_W = (width - 48) / 2;
const CHART_W = width - 48;

// ── SVG Wave sparkline for hero cards ────────────────────────────────────────
function WaveSparkline({ values, color, w = CARD_W - 24, h = 42 }) {
  if (!values || values.length < 2) {
    // flat line placeholder
    return (
      <Svg width={w} height={h}>
        <Polyline points={`0,${h / 2} ${w},${h / 2}`} fill="none" stroke={color} strokeWidth="1.5" opacity="0.4" />
      </Svg>
    );
  }
  const max = Math.max(...values, 1);
  const min = Math.min(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - 4 - ((v - min) / range) * (h - 8);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <Svg width={w} height={h}>
      <Polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.6"
      />
    </Svg>
  );
}

// ── SVG Bar chart ─────────────────────────────────────────────────────────────
function BarChartSVG({ values, alerts, color, dangerColor }) {
  const w = CHART_W;
  const h = 140;
  const padL = 28, padB = 24, padT = 10, padR = 8;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;
  const display = values.slice(-12);
  const displayAlerts = alerts.slice(-12);
  const barMax = Math.max(...display, 1);
  const barW = (chartW / display.length) * 0.55;
  const gap = chartW / display.length;

  // Y axis ticks
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(t => ({
    val: parseFloat((t * barMax).toFixed(1)),
    y: padT + chartH - t * chartH,
  }));

  return (
    <Svg width={w} height={h}>
      {/* Y axis ticks */}
      {ticks.map((tick, i) => (
        <React.Fragment key={i}>
          <Line
            x1={padL} y1={tick.y}
            x2={w - padR} y2={tick.y}
            stroke="rgba(128,128,128,0.1)"
            strokeWidth="1"
          />
          <SvgText
            x={padL - 4} y={tick.y + 3.5}
            fontSize="8" fill="rgba(128,128,128,0.6)"
            textAnchor="end"
          >{tick.val}</SvgText>
        </React.Fragment>
      ))}
      {/* Bars */}
      {display.map((v, i) => {
        const barH = Math.max((v / barMax) * chartH, 2);
        const x = padL + i * gap + (gap - barW) / 2;
        const y = padT + chartH - barH;
        const isAlert = displayAlerts[i];
        const fill = isAlert ? dangerColor : color;
        return (
          <React.Fragment key={i}>
            <Rect
              x={x} y={y}
              width={barW} height={barH}
              rx="3"
              fill={fill}
              opacity={isAlert ? 0.9 : 0.8}
            />
          </React.Fragment>
        );
      })}
      {/* X axis line */}
      <Line
        x1={padL} y1={padT + chartH}
        x2={w - padR} y2={padT + chartH}
        stroke="rgba(128,128,128,0.2)"
        strokeWidth="1"
      />
    </Svg>
  );
}

// ── SVG Line chart with area fill ─────────────────────────────────────────────
function LineChartSVG({ values, color }) {
  const w = CHART_W;
  const h = 130;
  const padL = 28, padB = 24, padT = 10, padR = 8;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;

  if (!values || values.length < 2) return null;

  const max = Math.max(...values, 1);
  const min = Math.min(...values);
  const range = max - min || 1;

  const pts = values.map((v, i) => {
    const x = padL + (i / (values.length - 1)) * chartW;
    const y = padT + chartH - ((v - min) / range) * chartH;
    return [x, y];
  });

  const polyPts = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const areaPath = [
    `M ${pts[0][0].toFixed(1)},${(padT + chartH).toFixed(1)}`,
    ...pts.map(([x, y]) => `L ${x.toFixed(1)},${y.toFixed(1)}`),
    `L ${pts[pts.length - 1][0].toFixed(1)},${(padT + chartH).toFixed(1)}`,
    'Z',
  ].join(' ');

  const ticks = [0, 0.5, 1].map(t => ({
    val: parseFloat((min + t * range).toFixed(1)),
    y: padT + chartH - t * chartH,
  }));

  return (
    <Svg width={w} height={h}>
      <Defs>
        <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.25" />
          <Stop offset="1" stopColor={color} stopOpacity="0.01" />
        </LinearGradient>
      </Defs>
      {ticks.map((tick, i) => (
        <React.Fragment key={i}>
          <Line x1={padL} y1={tick.y} x2={w - padR} y2={tick.y} stroke="rgba(128,128,128,0.1)" strokeWidth="1" />
          <SvgText x={padL - 4} y={tick.y + 3.5} fontSize="8" fill="rgba(128,128,128,0.6)" textAnchor="end">{tick.val}</SvgText>
        </React.Fragment>
      ))}
      <Path d={areaPath} fill="url(#areaGrad)" />
      <Polyline
        points={polyPts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1={padL} y1={padT + chartH} x2={w - padR} y2={padT + chartH} stroke="rgba(128,128,128,0.2)" strokeWidth="1" />
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function Statistiques({ navigation }) {
  const { token } = useAuth();
  const { colors } = useTheme();
  const [onglet, setOnglet] = useState('S1');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const chargerHistory = async (systeme) => {
    setLoading(true);
    try {
      const data = await getHistory(token, systeme);
      setHistory(data.historique || []);
    } catch (e) { console.log('Erreur history:', e); }
    finally { setLoading(false); }
  };

  useEffect(() => { chargerHistory(onglet); }, [onglet]);

  const getValeur = (h) => {
    if (onglet === 'S1') return parseFloat(h.poids_kg) || 0;
    if (onglet === 'S2') return parseFloat(h.debit_lpm) || 0;
    if (onglet === 'S3') return h.mouvement ? 1 : 0;
    return 0;
  };

  const valeurs = history.map(getValeur);
  const alertFlags = history.map(h => !!h.alerte);
  const max = valeurs.length ? Math.max(...valeurs) : 0;
  const min = valeurs.length ? Math.min(...valeurs) : 0;
  const moy = valeurs.length
    ? parseFloat((valeurs.reduce((a, b) => a + b, 0) / valeurs.length).toFixed(1))
    : 0;
  const alertes = history.filter(h => h.alerte).length;
  const normal = history.length - alertes;

  const onglets = [
    { id: 'S1', label: 'Stockage',  icon: 'cube-outline',        couleur: colors.s1Color, unite: 'kg'    },
    { id: 'S2', label: 'Eau',       icon: 'water-outline',       couleur: colors.s2Color, unite: 'L/min' },
    { id: 'S3', label: 'Périmètre', icon: 'lock-closed-outline', couleur: colors.s3Color, unite: 'mvt'   },
  ];
  const ongletActif = onglets.find(o => o.id === onglet);

  return (
    <ScrollView style={[s.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.retourBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[s.titre, { color: colors.textPrimary }]}>Rapport</Text>
        <View style={{ flex: 1 }} />
        <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
      </View>

      <Text style={[s.sectionLabel, { color: colors.textPrimary }]}>Aperçu général</Text>

      {/* ── Onglets ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 16, marginBottom: 16 }} contentContainerStyle={{ gap: 8, paddingRight: 16 }}>
        {onglets.map(o => {
          const actif = onglet === o.id;
          return (
            <TouchableOpacity
              key={o.id}
              style={[s.ongletPill, {
                backgroundColor: actif ? o.couleur : colors.card,
                borderColor: actif ? o.couleur : colors.cardBorder,
              }]}
              onPress={() => setOnglet(o.id)}
            >
              <Ionicons name={o.icon} size={13} color={actif ? '#fff' : colors.textMuted} />
              <Text style={[s.ongletText, { color: actif ? '#fff' : colors.textMuted }]}>{o.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Hero cards ── */}
      <View style={s.heroRow}>
        {/* Normal card */}
        <View style={[s.heroCard, { backgroundColor: ongletActif.couleur }]}>
          <Text style={s.heroNum}>{normal}</Text>
          <Text style={s.heroLabel}>Mesures normales</Text>
          <View style={{ marginTop: 6 }}>
            <WaveSparkline values={valeurs.slice(-12)} color="#fff" />
          </View>
        </View>
        {/* Alert card */}
        <View style={[s.heroCard, { backgroundColor: colors.danger }]}>
          <Text style={s.heroNum}>{alertes}</Text>
          <Text style={s.heroLabel}>Alertes déclenchées</Text>
          <View style={{ marginTop: 6 }}>
            <WaveSparkline values={alertFlags.map(a => a ? 1 : 0).slice(-12)} color="#fff" />
          </View>
        </View>
      </View>

      {/* ── Bar chart ── */}
      <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={s.cardHead}>
          <View>
            <Text style={[s.cardTitre, { color: colors.textPrimary }]}>Évolution des mesures</Text>
            <Text style={[s.cardSub, { color: colors.textSecondary }]}>{ongletActif.label} · {ongletActif.unite}</Text>
          </View>
          <View style={[s.unitPill, { backgroundColor: ongletActif.couleur + '18' }]}>
            <Text style={[s.unitText, { color: ongletActif.couleur }]}>{onglet}</Text>
          </View>
        </View>

        {loading ? (
          <View style={s.loader}><ActivityIndicator color={ongletActif.couleur} /></View>
        ) : valeurs.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="bar-chart-outline" size={32} color={colors.textMuted} />
            <Text style={[s.emptyTxt, { color: colors.textMuted }]}>Aucune donnée</Text>
          </View>
        ) : (
          <BarChartSVG values={valeurs} alerts={alertFlags} color={ongletActif.couleur} dangerColor={colors.danger} />
        )}

        <View style={s.legendRow}>
          <View style={[s.legendDot, { backgroundColor: ongletActif.couleur }]} />
          <Text style={[s.legendTxt, { color: colors.textSecondary }]}>Normal</Text>
          <View style={[s.legendDot, { backgroundColor: colors.danger }]} />
          <Text style={[s.legendTxt, { color: colors.textSecondary }]}>Alerte</Text>
        </View>
      </View>

      {/* ── Line chart ── */}
      {valeurs.length > 1 && (
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={s.cardHead}>
            <View>
              <Text style={[s.cardTitre, { color: colors.textPrimary }]}>Tendance</Text>
              <Text style={[s.cardSub, { color: colors.textSecondary }]}>Courbe lissée · 20 mesures</Text>
            </View>
          </View>
          <LineChartSVG values={valeurs} color={ongletActif.couleur} />
        </View>
      )}

      {/* ── Stats summary ── */}
      <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <Text style={[s.cardTitre, { color: colors.textPrimary, marginBottom: 14 }]}>Résumé statistique</Text>
        <View style={s.statsGrid}>
          {[
            { label: 'Maximum', value: max, unit: ongletActif.unite, icon: 'arrow-up-circle-outline', color: ongletActif.couleur },
            { label: 'Moyenne', value: moy, unit: ongletActif.unite, icon: 'analytics-outline',       color: ongletActif.couleur },
            { label: 'Minimum', value: min, unit: ongletActif.unite, icon: 'arrow-down-circle-outline', color: ongletActif.couleur },
            { label: 'Alertes', value: alertes, unit: 'total',       icon: 'warning-outline',          color: colors.danger       },
          ].map((k, i) => (
            <View key={i} style={[s.statBox, { backgroundColor: k.color + '0D', borderColor: k.color + '22' }]}>
              <Ionicons name={k.icon} size={18} color={k.color} />
              <Text style={[s.statVal, { color: k.color }]}>{k.value}</Text>
              <Text style={[s.statLabel, { color: colors.textSecondary }]}>{k.label}</Text>
              <Text style={[s.statUnit, { color: colors.textMuted }]}>{k.unit}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── History list ── */}
      <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={[s.cardHead, { marginBottom: 12 }]}>
          <Text style={[s.cardTitre, { color: colors.textPrimary }]}>Historique détaillé</Text>
          <Text style={[s.cardSub, { color: colors.textSecondary }]}>10 dernières entrées</Text>
        </View>
        {history.length === 0 && !loading ? (
          <View style={s.empty}>
            <Text style={[s.emptyTxt, { color: colors.textMuted }]}>Aucune mesure</Text>
          </View>
        ) : (
          history.slice(0, 10).map((h, i) => {
            const date = new Date(h.created_at).toLocaleDateString('fr-FR', {
              day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
            });
            const valeur = onglet === 'S1' ? `${h.poids_kg} kg`
              : onglet === 'S2' ? `${h.debit_lpm} L/min`
              : h.mouvement ? 'Mouvement' : 'Calme';
            const isAlert = !!h.alerte;
            return (
              <View key={i} style={[s.histRow, {
                borderBottomColor: colors.cardBorder,
                borderBottomWidth: i < 9 ? StyleSheet.hairlineWidth : 0,
              }]}>
                <View style={[s.histDot, {
                  backgroundColor: isAlert ? colors.danger + '20' : ongletActif.couleur + '20',
                }]}>
                  <Ionicons
                    name={isAlert ? 'warning-outline' : 'checkmark-outline'}
                    size={13}
                    color={isAlert ? colors.danger : ongletActif.couleur}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.histDate, { color: colors.textSecondary }]}>{date}</Text>
                  <Text style={[s.histStatus, { color: isAlert ? colors.danger : colors.success }]}>
                    {isAlert ? 'Alerte' : 'Normal'}
                  </Text>
                </View>
                <View style={[s.histBadge, { backgroundColor: (isAlert ? colors.danger : ongletActif.couleur) + '15' }]}>
                  <Text style={[s.histVal, { color: isAlert ? colors.danger : ongletActif.couleur }]}>{valeur}</Text>
                </View>
              </View>
            );
          })
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingTop: 56, paddingBottom: 16 },
  retourBtn:   { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  titre:       { fontSize: 18, fontWeight: '700' },
  sectionLabel:{ fontSize: 16, fontWeight: '700', paddingHorizontal: 16, marginBottom: 14 },

  ongletPill:  { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  ongletText:  { fontSize: 12, fontWeight: '600' },

  heroRow:     { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 16 },
  heroCard:    { flex: 1, borderRadius: 20, padding: 18, minHeight: 110 },
  heroNum:     { fontSize: 38, fontWeight: '800', color: '#fff', lineHeight: 42 },
  heroLabel:   { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '500', marginTop: 2 },

  card:        { borderRadius: 18, marginHorizontal: 16, marginBottom: 14, padding: 16, borderWidth: 1 },
  cardHead:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  cardTitre:   { fontSize: 14, fontWeight: '700' },
  cardSub:     { fontSize: 11, marginTop: 2 },
  unitPill:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  unitText:    { fontSize: 12, fontWeight: '700' },

  legendRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  legendDot:   { width: 8, height: 8, borderRadius: 4 },
  legendTxt:   { fontSize: 11, marginRight: 10 },

  loader:      { height: 100, justifyContent: 'center', alignItems: 'center' },
  empty:       { height: 80, justifyContent: 'center', alignItems: 'center', gap: 6 },
  emptyTxt:    { fontSize: 13 },

  statsGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statBox:     { width: '47%', borderRadius: 14, padding: 14, borderWidth: 1, gap: 4 },
  statVal:     { fontSize: 24, fontWeight: '800' },
  statLabel:   { fontSize: 12, fontWeight: '600' },
  statUnit:    { fontSize: 10 },

  histRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  histDot:     { width: 30, height: 30, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  histDate:    { fontSize: 11 },
  histStatus:  { fontSize: 10, fontWeight: '600', marginTop: 1 },
  histBadge:   { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  histVal:     { fontSize: 12, fontWeight: '700' },
});