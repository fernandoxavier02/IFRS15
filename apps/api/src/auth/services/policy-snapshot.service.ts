import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

export interface PolicySnapshot {
  id: string;
  contractId: string;
  version: number;
  policyData: Record<string, any>;
  createdAt: Date;
  createdBy: string;
  reason: string;
  isActive: boolean;
}

export interface PolicyDiff {
  field: string;
  oldValue: any;
  newValue: any;
  impact: 'low' | 'medium' | 'high';
}

@Injectable()
export class PolicySnapshotService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a policy snapshot for a contract version
   */
  async createSnapshot(
    contractId: string,
    policyData: Record<string, any>,
    userId: string,
    reason: string
  ): Promise<PolicySnapshot> {
    // Get current version number
    const lastSnapshot = await this.prisma.policySnapshot.findFirst({
      where: { contractId },
      orderBy: { version: 'desc' }
    });

    const version = (lastSnapshot?.version || 0) + 1;

    const snapshot = await this.prisma.policySnapshot.create({
      data: {
        contractId,
        version,
        policyData: JSON.stringify(policyData),
        createdBy: userId,
        reason,
        isActive: true
      }
    });

    // Deactivate previous snapshots
    await this.prisma.policySnapshot.updateMany({
      where: {
        contractId,
        id: { not: snapshot.id }
      },
      data: { isActive: false }
    });

    return {
      id: snapshot.id,
      contractId: snapshot.contractId,
      version: snapshot.version,
      policyData,
      createdAt: snapshot.createdAt,
      createdBy: snapshot.createdBy,
      reason: snapshot.reason,
      isActive: snapshot.isActive
    };
  }

  /**
   * Get active policy snapshot for a contract
   */
  async getActiveSnapshot(contractId: string): Promise<PolicySnapshot | null> {
    const snapshot = await this.prisma.policySnapshot.findFirst({
      where: {
        contractId,
        isActive: true
      }
    });

    if (!snapshot) return null;

    return {
      id: snapshot.id,
      contractId: snapshot.contractId,
      version: snapshot.version,
      policyData: JSON.parse(snapshot.policyData as string),
      createdAt: snapshot.createdAt,
      createdBy: snapshot.createdBy,
      reason: snapshot.reason,
      isActive: snapshot.isActive
    };
  }

  /**
   * Get all snapshots for a contract
   */
  async getContractSnapshots(contractId: string): Promise<PolicySnapshot[]> {
    const snapshots = await this.prisma.policySnapshot.findMany({
      where: { contractId },
      orderBy: { version: 'desc' }
    });

    return snapshots.map(snapshot => ({
      id: snapshot.id,
      contractId: snapshot.contractId,
      version: snapshot.version,
      policyData: JSON.parse(snapshot.policyData as string),
      createdAt: snapshot.createdAt,
      createdBy: snapshot.createdBy,
      reason: snapshot.reason,
      isActive: snapshot.isActive
    }));
  }

  /**
   * Compare two policy snapshots
   */
  async compareSnapshots(
    contractId: string,
    fromVersion: number,
    toVersion: number
  ): Promise<PolicyDiff[]> {
    const snapshots = await this.prisma.policySnapshot.findMany({
      where: {
        contractId,
        version: { in: [fromVersion, toVersion] }
      }
    });

    if (snapshots.length !== 2) {
      throw new Error('One or both snapshots not found');
    }

    const fromSnapshot = snapshots.find(s => s.version === fromVersion);
    const toSnapshot = snapshots.find(s => s.version === toVersion);

    const fromData = JSON.parse(fromSnapshot!.policyData as string);
    const toData = JSON.parse(toSnapshot!.policyData as string);

    return this.calculateDifferences(fromData, toData);
  }

  /**
   * Get snapshot by version
   */
  async getSnapshotByVersion(contractId: string, version: number): Promise<PolicySnapshot | null> {
    const snapshot = await this.prisma.policySnapshot.findFirst({
      where: {
        contractId,
        version
      }
    });

    if (!snapshot) return null;

    return {
      id: snapshot.id,
      contractId: snapshot.contractId,
      version: snapshot.version,
      policyData: JSON.parse(snapshot.policyData as string),
      createdAt: snapshot.createdAt,
      createdBy: snapshot.createdBy,
      reason: snapshot.reason,
      isActive: snapshot.isActive
    };
  }

  /**
   * Restore a specific snapshot version
   */
  async restoreSnapshot(
    contractId: string,
    version: number,
    userId: string,
    reason: string
  ): Promise<PolicySnapshot> {
    const snapshotToRestore = await this.getSnapshotByVersion(contractId, version);
    if (!snapshotToRestore) {
      throw new Error(`Snapshot version ${version} not found for contract ${contractId}`);
    }

    // Create new snapshot with restored data
    return this.createSnapshot(
      contractId,
      snapshotToRestore.policyData,
      userId,
      `Restored from version ${version}: ${reason}`
    );
  }

  /**
   * Auto-create snapshot on policy changes
   */
  async autoSnapshot(
    contractId: string,
    newPolicyData: Record<string, any>,
    userId: string,
    changeDescription?: string
  ): Promise<PolicySnapshot | null> {
    const currentSnapshot = await this.getActiveSnapshot(contractId);
    
    if (!currentSnapshot) {
      // First snapshot
      return this.createSnapshot(
        contractId,
        newPolicyData,
        userId,
        'Initial policy snapshot'
      );
    }

    // Check if there are significant changes
    const differences = this.calculateDifferences(currentSnapshot.policyData, newPolicyData);
    const hasSignificantChanges = differences.some(diff => diff.impact === 'high' || diff.impact === 'medium');

    if (hasSignificantChanges) {
      const reason = changeDescription || `Auto-snapshot: ${differences.length} policy changes detected`;
      return this.createSnapshot(contractId, newPolicyData, userId, reason);
    }

    return null; // No significant changes
  }

  private calculateDifferences(oldData: any, newData: any, prefix = ''): PolicyDiff[] {
    const differences: PolicyDiff[] = [];

    // Get all unique keys
    const allKeys = new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})]);

    for (const key of allKeys) {
      const fieldPath = prefix ? `${prefix}.${key}` : key;
      const oldValue = oldData?.[key];
      const newValue = newData?.[key];

      if (oldValue === undefined && newValue !== undefined) {
        differences.push({
          field: fieldPath,
          oldValue: null,
          newValue,
          impact: this.assessImpact(key, oldValue, newValue)
        });
      } else if (oldValue !== undefined && newValue === undefined) {
        differences.push({
          field: fieldPath,
          oldValue,
          newValue: null,
          impact: this.assessImpact(key, oldValue, newValue)
        });
      } else if (typeof oldValue === 'object' && typeof newValue === 'object' && oldValue !== null && newValue !== null) {
        // Recursive comparison for nested objects
        differences.push(...this.calculateDifferences(oldValue, newValue, fieldPath));
      } else if (oldValue !== newValue) {
        differences.push({
          field: fieldPath,
          oldValue,
          newValue,
          impact: this.assessImpact(key, oldValue, newValue)
        });
      }
    }

    return differences;
  }

  private assessImpact(field: string, oldValue: any, newValue: any): 'low' | 'medium' | 'high' {
    // Critical fields that impact revenue recognition
    const criticalFields = [
      'revenueRecognitionMethod',
      'performanceObligations',
      'transactionPrice',
      'allocationMethod',
      'progressMeasurement'
    ];

    // Important fields that may impact calculations
    const importantFields = [
      'contractTerm',
      'variableConsideration',
      'constraintMethod',
      'discountRate',
      'amortizationMethod'
    ];

    if (criticalFields.some(cf => field.includes(cf))) {
      return 'high';
    }

    if (importantFields.some(imf => field.includes(imf))) {
      return 'medium';
    }

    return 'low';
  }
}
