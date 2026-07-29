import type { RawActivityRow, NormalizedActivity } from '../types/activity';
import type { AppId, AppCategory } from '../dictionaries/apps';
import type { Department } from '../dictionaries/departments';
import type { TaskCategoryId } from '../dictionaries/taskCategories';
import { IssueCollector } from '../types/common';
import { lookupApp } from '../dictionaries/apps';
import { lookupTaskCategory } from '../dictionaries/taskCategories';
import { lookupDepartment } from '../dictionaries/departments';
import { normalizeTimestamp } from './datetime';
import { normalizeBoolean, normalizeDuration, stableHash, cleanString, normalizeEmployeeId, DurationQuality } from './primitives';
import { DATA_CONFIG } from '../config';

export interface NormalizeActivitiesResult {
  activities: NormalizedActivity[];
  rowsRead: number;
  duplicatesDropped: number;
  rowsDropped: number;
}

export function normalizeActivities(
  rawRows: RawActivityRow[],
  issues: IssueCollector,
  options: { dedupe: boolean }
): NormalizeActivitiesResult {
  const activities: NormalizedActivity[] = [];
  const seenHashes = new Set<string>();
  let duplicatesDropped = 0;
  let rowsDropped = 0;

  rawRows.forEach((row, index) => {
    // 1. Timestamp validation (crucial)
    const timestampNorm = normalizeTimestamp(row.timestamp);
    if (!timestampNorm) {
      issues.add({
        code: 'UNPARSEABLE_TIMESTAMP',
        severity: 'error',
        entity: 'activity',
        sourceIndex: index,
        rawValue: row.timestamp,
        message: `Activity row ${index} has an unparseable timestamp "${row.timestamp}" and was skipped.`,
      });
      rowsDropped++;
      return;
    }

    // 2. Employee ID
    const finalEmployeeId = normalizeEmployeeId(row.employee_id);
    if (!finalEmployeeId && row.employee_id && row.employee_id !== '?') {
      issues.add({
        code: 'INVALID_EMPLOYEE_ID',
        severity: 'warning',
        entity: 'activity',
        sourceIndex: index,
        rawValue: row.employee_id,
        message: `Activity row ${index} has an invalid employee ID "${row.employee_id}".`,
      });
    }

    // 3. Department
    const deptRaw = cleanString(row.department);
    const deptNorm = lookupDepartment(deptRaw);
    if (!deptNorm) {
      issues.add({
        code: 'UNMAPPED_DEPARTMENT',
        severity: 'warning',
        entity: 'activity',
        sourceIndex: index,
        field: 'department',
        rawValue: row.department,
        message: `Department "${row.department}" is not in the canonical list.`,
      });
    }

    // 4. App lookup
    const appLookup = lookupApp(row.app_used);
    if (!appLookup.matched && !appLookup.wasEmpty) {
      issues.add({
        code: 'UNMAPPED_APP',
        severity: 'warning',
        entity: 'activity',
        sourceIndex: index,
        field: 'app_used',
        rawValue: row.app_used,
        message: `Application "${row.app_used}" is not mapped to any canonical application.`,
      });
    }

    // 5. Task Category lookup
    const categoryLookup = lookupTaskCategory(row.task_category);
    if (!categoryLookup.matched && !categoryLookup.wasEmpty) {
      issues.add({
        code: 'UNMAPPED_TASK_CATEGORY',
        severity: 'warning',
        entity: 'activity',
        sourceIndex: index,
        field: 'task_category',
        rawValue: row.task_category,
        message: `Task Category "${row.task_category}" is not mapped to any canonical category.`,
      });
    }

    // 6. Measures (Duration + Repetitive)
    const durationNorm = normalizeDuration(row.duration_minutes);
    if (durationNorm.quality === 'missing') {
      issues.add({
        code: 'MISSING_DURATION',
        severity: 'warning',
        entity: 'activity',
        sourceIndex: index,
        message: `Activity row ${index} is missing duration_minutes.`,
      });
    } else if (durationNorm.quality === 'invalid') {
      issues.add({
        code: 'INVALID_DURATION',
        severity: 'warning',
        entity: 'activity',
        sourceIndex: index,
        rawValue: row.duration_minutes,
        message: `Activity row ${index} has an invalid duration "${row.duration_minutes}".`,
      });
    } else if (durationNorm.quality === 'implausible') {
      issues.add({
        code: 'IMPLAUSIBLE_DURATION',
        severity: 'warning',
        entity: 'activity',
        sourceIndex: index,
        rawValue: row.duration_minutes,
        message: `Activity row ${index} has an implausible duration "${row.duration_minutes}".`,
      });
    }

    const repetitiveNorm = normalizeBoolean(row.is_repetitive);
    if (row.is_repetitive && repetitiveNorm === null && !['', '-', 'na', 'n/a', 'null', 'none'].includes(row.is_repetitive.trim().toLowerCase())) {
      issues.add({
        code: 'UNPARSEABLE_BOOLEAN',
        severity: 'warning',
        entity: 'activity',
        sourceIndex: index,
        rawValue: row.is_repetitive,
        message: `Activity row ${index} has an unparseable is_repetitive value "${row.is_repetitive}".`,
      });
    }

    // 7. Identity & Deduping
    const identityString = `${row.employee_id ?? ''}|${row.timestamp ?? ''}|${row.app_used ?? ''}|${row.task_category ?? ''}|${row.duration_minutes ?? ''}|${row.is_repetitive ?? ''}`;
    const activityId = stableHash(identityString);

    if (options.dedupe && seenHashes.has(activityId)) {
      duplicatesDropped++;
      issues.add({
        code: 'DUPLICATE_ACTIVITY_ROW',
        severity: 'warning',
        entity: 'activity',
        sourceIndex: index,
        message: `Duplicate activity row at index ${index} was dropped.`,
      });
      return;
    }
    seenHashes.add(activityId);

    activities.push({
      activityId,
      employeeId: finalEmployeeId,
      timestampUtc: timestampNorm.timestampUtc,
      localDate: timestampNorm.localDate,
      localTime: timestampNorm.localTime,
      hourOfDay: timestampNorm.hourOfDay,
      weekday: timestampNorm.weekday,
      isoWeek: timestampNorm.isoWeek,
      appId: appLookup.definition.id,
      appLabel: appLookup.definition.label,
      appCategory: appLookup.definition.category,
      appRaw: cleanString(row.app_used),
      taskCategoryId: categoryLookup.definition.id,
      taskCategoryLabel: categoryLookup.definition.label,
      taskCategoryRaw: cleanString(row.task_category),
      isAutomatableCategory: categoryLookup.definition.isAutomatable,
      durationMinutes: durationNorm.minutes,
      durationQuality: durationNorm.quality as any, // Cast to any to align with types if needed
      durationRaw: durationNorm.raw,
      isRepetitive: repetitiveNorm,
      reportedDepartment: deptNorm ?? 'Unknown',
      isOrphan: false,
      sourceRowIndex: index,
    });
  });

  // Sort activities by timestampUtc as required by joinDatasets.ts
  activities.sort((a, b) => a.timestampUtc.localeCompare(b.timestampUtc));

  return {
    activities,
    rowsRead: rawRows.length,
    duplicatesDropped,
    rowsDropped,
  };
}
