// 导出所有重命名相关的模块

// 服务
import { getRenameService } from './rename-service';

// 控制器
import { getRenameController, RENAME_EVENTS } from './rename-controller';

// 组件
export { default as UndoRedoButtons } from './components/UndoRedoButtons';

// 工具函数
export * from './history-manager';

export {
  // 服务
  getRenameService,
  
  // 控制器
  getRenameController,
  RENAME_EVENTS,
  
  // 类型
  STATUS as RENAME_STATUS
} from './rename-service';

// 默认导出控制器
export default getRenameController();
