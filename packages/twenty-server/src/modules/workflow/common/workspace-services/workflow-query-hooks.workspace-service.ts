import { Injectable } from '@nestjs/common';

import { WorkflowVersionWorkspaceEntity } from 'src/modules/workflow/common/standard-objects/workflow-version.workspace-entity';
import { WorkflowRunWorkspaceEntity } from 'src/modules/workflow/common/standard-objects/workflow-run.workspace-entity';
import { WorkflowAutomatedTriggerWorkspaceEntity } from 'src/modules/workflow/common/standard-objects/workflow-automated-trigger.workspace-entity';
import { WorkspaceRepository } from 'src/engine/twenty-orm/repository/workspace.repository';
import { WorkflowActionType } from 'src/modules/workflow/workflow-executor/workflow-actions/types/workflow-action.type';
import { TwentyORMGlobalManager } from 'src/engine/twenty-orm/twenty-orm-global.manager';
import { ServerlessFunctionService } from 'src/engine/metadata-modules/serverless-function/serverless-function.service';

@Injectable()
export class WorkflowQueryHooksWorkspaceService {
  constructor(
    private readonly twentyORMGlobalManager: TwentyORMGlobalManager,
    private readonly serverlessFunctionService: ServerlessFunctionService,
  ) {}

  async handleWorkflowSubEntities({
    workflowIds,
    workspaceId,
    operation,
  }: {
    workflowIds: string[];
    workspaceId: string;
    operation: 'restore' | 'delete' | 'destroy';
  }): Promise<void> {
    const workflowVersionRepository =
      await this.twentyORMGlobalManager.getRepositoryForWorkspace<WorkflowVersionWorkspaceEntity>(
        workspaceId,
        'workflowVersion',
        { shouldBypassPermissionChecks: true }, // settings permissions are checked at resolver-level
      );

    const workflowRunRepository =
      await this.twentyORMGlobalManager.getRepositoryForWorkspace<WorkflowRunWorkspaceEntity>(
        workspaceId,
        'workflowRun',
        { shouldBypassPermissionChecks: true }, // settings permissions are checked at resolver-level
      );

    const workflowAutomatedTriggerRepository =
      await this.twentyORMGlobalManager.getRepositoryForWorkspace<WorkflowAutomatedTriggerWorkspaceEntity>(
        workspaceId,
        'workflowAutomatedTrigger',
        { shouldBypassPermissionChecks: true }, // settings permissions are checked at resolver-level
      );

    for (const workflowId of workflowIds) {
      switch (operation) {
        case 'delete':
          await workflowAutomatedTriggerRepository.softDelete({
            workflowId,
          });

          await workflowRunRepository.softDelete({
            workflowId,
          });

          await workflowVersionRepository.softDelete({
            workflowId,
          });

          break;
        case 'restore':
          await workflowAutomatedTriggerRepository.restore({
            workflowId,
          });

          await workflowRunRepository.restore({
            workflowId,
          });

          await workflowVersionRepository.restore({
            workflowId,
          });

          break;
      }

      await this.handleServerlessFunctionSubEntities({
        workflowVersionRepository,
        workflowId,
        workspaceId,
        operation,
      });
    }
  }

  private async handleServerlessFunctionSubEntities({
    workflowVersionRepository,
    workflowId,
    workspaceId,
    operation,
  }: {
    workflowVersionRepository: WorkspaceRepository<WorkflowVersionWorkspaceEntity>;

    workflowId: string;

    workspaceId: string;
    operation: 'restore' | 'delete' | 'destroy';
  }) {
    const workflowVersions = await workflowVersionRepository.find({
      where: {
        workflowId,
      },
      withDeleted: true,
    });

    workflowVersions.forEach((workflowVersion) => {
      workflowVersion.steps?.forEach(async (step) => {
        if (step.type === WorkflowActionType.CODE) {
          switch (operation) {
            case 'delete':
              await this.serverlessFunctionService.deleteOneServerlessFunction({
                id: step.settings.input.serverlessFunctionId,
                workspaceId,
                softDelete: true,
              });
              break;
            case 'restore':
              await this.serverlessFunctionService.restoreOneServerlessFunction(
                step.settings.input.serverlessFunctionId,
              );
              break;
            case 'destroy':
              await this.serverlessFunctionService.deleteOneServerlessFunction({
                id: step.settings.input.serverlessFunctionId,
                workspaceId,
                softDelete: false,
              });
              break;
          }
        }
      });
    });
  }
}
