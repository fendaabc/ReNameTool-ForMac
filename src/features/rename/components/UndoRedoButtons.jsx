import React, { useState, useEffect } from 'react';
import { getRenameController, RENAME_EVENTS as EVENTS } from '../rename-controller';
import { Button } from '../../../components/buttons';
import { Icon } from '../../../components/icons';

/**
 * 撤销/重做按钮组件
 * @param {Object} props - 组件属性
 * @param {string} [props.className] - 自定义类名
 * @param {boolean} [props.showLabels=true] - 是否显示文字标签
 * @param {boolean} [props.showIcons=true] - 是否显示图标
 * @param {string} [props.undoLabel='撤销'] - 撤销按钮文字
 * @param {string} [props.redoLabel='重做'] - 重做按钮文字
 * @returns {JSX.Element} 撤销/重做按钮组件
 */
export function UndoRedoButtons({
  className = '',
  showLabels = true,
  showIcons = true,
  undoLabel = '撤销',
  redoLabel = '重做'
}) {
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  
  // 获取控制器实例
  const controller = getRenameController();
  
  // 初始化状态
  useEffect(() => {
    updateButtonStates();
    
    // 订阅历史记录变化
    const unsubscribe = controller.on(EVENTS.HISTORY_CHANGED, () => {
      updateButtonStates();
    });
    
    // 组件卸载时取消订阅
    return () => {
      unsubscribe();
    };
  }, []);
  
  // 更新按钮状态
  const updateButtonStates = () => {
    setCanUndo(controller.canUndo());
    setCanRedo(controller.canRedo());
  };
  
  // 处理撤销
  const handleUndo = () => {
    if (canUndo) {
      controller.undo().catch(error => {
        console.error('Undo failed:', error);
      });
    }
  };
  
  // 处理重做
  const handleRedo = () => {
    if (canRedo) {
      controller.redo().catch(error => {
        console.error('Redo failed:', error);
      });
    }
  };
  
  return (
    <div className={`undo-redo-buttons ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleUndo}
        disabled={!canUndo}
        title="撤销 (Ctrl+Z)"
        aria-label="撤销"
        className="undo-button"
      >
        {showIcons && <Icon name="undo" size={16} />}
        {showLabels && <span className="ml-1">{undoLabel}</span>}
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRedo}
        disabled={!canRedo}
        title="重做 (Ctrl+Shift+Z 或 Ctrl+Y)"
        aria-label="重做"
        className="redo-button"
      >
        {showIcons && <Icon name="redo" size={16} />}
        {showLabels && <span className="ml-1">{redoLabel}</span>}
      </Button>
    </div>
  );
}

// 默认导出
UndoRedoButtons.displayName = 'UndoRedoButtons';
export default UndoRedoButtons;
