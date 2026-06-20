interface ColumnaConfig {
  key: string;
  label: string;
  getValue?: (row: any) => any;
}