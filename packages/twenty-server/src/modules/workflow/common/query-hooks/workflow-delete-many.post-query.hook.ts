import { WorkspacePostQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { WorkspaceQueryHookType } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/types/workspace-query-hook.type';
import { AuthContext } from 'src/engine/core-modules/auth/types/auth-context.type';
import { WorkflowWorkspaceEntity } from 'src/modules/workflow/common/standard-objects/workflow.workspace-entity';
import { workspaceValidator } from 'src/engine/core-modules/workspace/workspace.validate';
import { WorkflowQueryHooksWorkspaceService } from 'src/modules/workflow/common/workspace-services/workflow-query-hooks.workspace-service';

@WorkspaceQueryHook({
  key: `workflow.deleteMany`,
  type: WorkspaceQueryHookType.POST_HOOK,
})
export class WorkflowDeleteManyPostQueryHook
  implements WorkspacePostQueryHookInstance
{
  constructor(
    private readonly workflowQueryHooksWorkspaceService: WorkflowQueryHooksWorkspaceService,
  ) {}

  async execute(
    authContext: AuthContext,
    _objectName: string,
    payload: WorkflowWorkspaceEntity[],
  ): Promise<void> {
    const workspace = authContext.workspace;

    workspaceValidator.assertIsDefinedOrThrow(workspace);

    await this.workflowQueryHooksWorkspaceService.handleWorkflowSubEntities({
      workflowIds: payload.map((workflow) => workflow.id),
      workspaceId: workspace.id,
      operation: 'delete',
    });
  }
}
