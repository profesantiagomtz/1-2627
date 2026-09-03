// A simulated command only: never pass this input to a shell or operating system.
export function isWordRunCommand(command: string): boolean {
  return /^winword(?:\.exe)?$/i.test(command.trim());
}

export type WordLaunchRoute = 'shortcut' | 'run' | 'taskbar';
export const wordLaunchLabels: Record<WordLaunchRoute, string> = {
  shortcut: 'desde el acceso directo del escritorio',
  run: 'con Ejecutar → WINWORD',
  taskbar: 'desde el icono anclado en la barra de tareas',
};
