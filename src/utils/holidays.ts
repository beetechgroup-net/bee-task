export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
  type: "Feriado" | "Compensar" | "Ponto Facultativo";
}

export const HOLIDAYS_2026: Holiday[] = [
  { date: "2026-02-16", name: "Carnaval", type: "Compensar" },
  { date: "2026-02-17", name: "Carnaval", type: "Feriado" },
  { date: "2026-02-18", name: "Carnaval", type: "Compensar" },
  { date: "2026-04-02", name: "Paixão de Cristo", type: "Compensar" },
  { date: "2026-04-03", name: "Paixão de Cristo", type: "Feriado" },
  { date: "2026-04-20", name: "Tiradentes", type: "Compensar" },
  { date: "2026-04-21", name: "Tiradentes", type: "Feriado" },
  { date: "2026-05-01", name: "Dia do Trabalhador", type: "Feriado" },
  { date: "2026-06-04", name: "Corpus Christi", type: "Feriado" },
  { date: "2026-06-05", name: "Corpus Christi", type: "Compensar" },
  { date: "2026-06-13", name: "Santo Antônio (Padroeiro)", type: "Feriado" },
  { date: "2026-08-26", name: "Aniversário de Campo Grande", type: "Feriado" },
  { date: "2026-09-07", name: "Independência do Brasil", type: "Feriado" },
  { date: "2026-10-11", name: "Criação do Estado", type: "Feriado" },
  { date: "2026-10-12", name: "Nossa Senhora Aparecida", type: "Feriado" },
  { date: "2026-11-02", name: "Finados", type: "Feriado" },
  { date: "2026-11-15", name: "Proclamação da República", type: "Feriado" },
  { date: "2026-11-20", name: "Dia da Consciência Negra", type: "Feriado" },
  { date: "2026-12-25", name: "Natal", type: "Feriado" },
];
