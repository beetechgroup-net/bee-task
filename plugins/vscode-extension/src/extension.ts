import * as vscode from 'vscode';
import { BeeTaskService } from '../../../scripts/beeTaskService';

let beeService: BeeTaskService | undefined;
let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
  console.log('Bee Task extension is now active');

  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = 'bee-task.toggleTask';
  context.subscriptions.push(statusBarItem);

  const updateService = () => {
    const config = vscode.workspace.getConfiguration('beeTask');
    const userId = config.get<string>('userId');
    const serviceAccountPath = config.get<string>('serviceAccountPath');

    if (userId && serviceAccountPath) {
      beeService = new BeeTaskService(serviceAccountPath, userId);
      updateStatusBar();
    } else {
      beeService = undefined;
      statusBarItem.hide();
    }
  };

  updateService();

  vscode.workspace.onDidChangeConfiguration(e => {
    if (e.affectsConfiguration('beeTask')) {
      updateService();
    }
  });

  const updateStatusBar = async () => {
    if (!beeService) return;
    try {
      const tasks = await beeService.getTasks();
      const activeTask = tasks.find(t => t.logs.some(l => !l.endTime));
      if (activeTask) {
        statusBarItem.text = `$(pulse) Bee: ${activeTask.title}`;
        statusBarItem.tooltip = 'Click to pause task';
        statusBarItem.show();
      } else {
        statusBarItem.text = `$(play) Bee Task: Idle`;
        statusBarItem.tooltip = 'Click to start last task';
        statusBarItem.show();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Poll for updates every 30 seconds
  const interval = setInterval(updateStatusBar, 30000);
  context.subscriptions.push({ dispose: () => clearInterval(interval) });

  let toggleCmd = vscode.commands.registerCommand('bee-task.toggleTask', async () => {
    if (!beeService) {
      vscode.window.showErrorMessage('Bee Task: Please configure User ID and Service Account Path in settings.');
      return;
    }

    const tasks = await beeService.getTasks();
    const activeTask = tasks.find(t => t.logs.some(l => !l.endTime));

    if (activeTask) {
      await beeService.toggleTask(activeTask.id);
      vscode.window.showInformationMessage(`Paused: ${activeTask.title}`);
    } else {
      const pendingTasks = tasks.filter(t => t.status !== 'done');
      if (pendingTasks.length === 0) {
        vscode.window.showInformationMessage('No pending tasks. Create one?');
        return;
      }
      const selected = await vscode.window.showQuickPick(
        pendingTasks.map(t => ({ label: t.title, id: t.id })),
        { placeHolder: 'Select a task to start' }
      );
      if (selected) {
        await beeService.toggleTask(selected.id);
        vscode.window.showInformationMessage(`Started: ${selected.label}`);
      }
    }
    updateStatusBar();
  });

  let createCmd = vscode.commands.registerCommand('bee-task.createTask', async () => {
    if (!beeService) return;
    const title = await vscode.window.showInputBox({ prompt: 'Task Title' });
    if (title) {
      const task = await beeService.addTask(title);
      vscode.window.showInformationMessage(`Task created: ${task.title}`);
      updateStatusBar();
    }
  });

  let finishCmd = vscode.commands.registerCommand('bee-task.finishTask', async () => {
    if (!beeService) return;
    const tasks = await beeService.getTasks();
    const activeTask = tasks.find(t => t.logs.some(l => !l.endTime));
    
    if (activeTask) {
      await beeService.finishTask(activeTask.id);
      vscode.window.showInformationMessage(`Finished: ${activeTask.title}`);
      updateStatusBar();
    } else {
      const pendingTasks = tasks.filter(t => t.status !== 'done');
      const selected = await vscode.window.showQuickPick(
        pendingTasks.map(t => ({ label: t.title, id: t.id })),
        { placeHolder: 'Select a task to finish' }
      );
      if (selected) {
        await beeService.finishTask(selected.id);
        vscode.window.showInformationMessage(`Finished: ${selected.label}`);
        updateStatusBar();
      }
    }
  });

  context.subscriptions.push(toggleCmd, createCmd, finishCmd);
}

export function deactivate() {}
