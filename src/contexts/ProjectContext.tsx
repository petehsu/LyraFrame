import { createContext, useContext } from 'react';
import type { ProjectContext } from '../services/projectService';

/**
 * 项目上下文 - 在整个应用中共享当前项目信息
 */
export const ProjectHandleContext = createContext<ProjectContext | null>(null);

/**
 * 获取当前项目上下文的 hook
 */
export function useProjectHandle() {
    return useContext(ProjectHandleContext);
}
