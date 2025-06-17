import { WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { DestroyOneResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { AuthContext } from 'src/engine/core-modules/auth/types/auth-context.type';
import { workspaceValidator } from 'src/engine/core-modules/workspace/workspace.validate';
import { WorkflowQueryHooksWorkspaceService } from 'src/modules/workflow/common/workspace-services/workflow-query-hooks.workspace-service';

@WorkspaceQueryHook('workflow.destroyOne')
export class WorkflowDestroyOnePreQueryHook
  implements WorkspacePreQueryHookInstance
{
  constructor(
    private readonly workflowQueryHooksWorkspaceService: WorkflowQueryHooksWorkspaceService,
  ) {}

  async execute(
    authContext: AuthContext,
    _objectName: string,
    payload: DestroyOneResolverArgs,
  ): Promise<DestroyOneResolverArgs> {
    const workspace = authContext.workspace;

    workspaceValidator.assertIsDefinedOrThrow(workspace);

    await this.workflowQueryHooksWorkspaceService.handleWorkflowSubEntities({
      workflowIds: [payload.id],
      workspaceId: workspace.id,
      operation: 'destroy',
    });

    return payload;
  }
}
