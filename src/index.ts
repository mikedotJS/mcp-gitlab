#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// ---------- helpers ----------
function run(
  cmd: string,
  args: string[],
  env: NodeJS.ProcessEnv = {}
): Promise<{ code: number; out: string; err: string }> {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, ...env },
    });
    let out = '',
      err = '';
    p.stdout.on('data', (d) => (out += d.toString()));
    p.stderr.on('data', (d) => (err += d.toString()));
    p.on('close', (code) => resolve({ code: code ?? 0, out, err }));
  });
}
async function runGlab(args: string[]) {
  const { code, out, err } = await run('glab', args);
  if (code !== 0)
    throw new Error(`glab ${args.join(' ')} failed (${code}): ${err || out}`);
  return { out, err };
}
async function runGlabJson(args: string[]) {
  const { out } = await runGlab(args);
  try {
    return JSON.parse(out);
  } catch {
    // Some `glab` subcommands (e.g. `api`) already emit JSON; others need '--output json'.
    return JSON.parse(out.trim());
  }
}
// Accept either numeric ID or path like "group/subgroup/project"
function projectIdOrEncodedPath(input: string): string {
  return /^\d+$/.test(input) ? input : encodeURIComponent(input);
}

// ---------- MCP server ----------
const server = new McpServer({ name: 'gitlab-glab', version: '0.1.0' });

/**
 * Tool: glab.version
 * Return glab version string (sanity + debug).
 */
server.registerTool(
  'glab_version',
  {
    title: 'Get glab version',
    description: "Returns 'glab --version' text to verify CLI presence",
    inputSchema: {},
  },
  async () => {
    const { out } = await runGlab(['--version']);
    return { content: [{ type: 'text', text: out.trim() }] };
  }
);

/**
 * Tool: gitlab.issues.list
 * Wraps `glab issue list` with JSON output & pagination.
 */
server.registerTool(
  'gitlab_issues_list',
  {
    title: 'List GitLab issues',
    description: 'List issues for a project using glab issue list',
    inputSchema: {
      project: z
        .string()
        .describe("Project path or numeric ID, e.g. 'gitlab-org/cli'"),
      state: z.enum(['opened', 'closed', 'all']).default('opened'),
      labels: z.string().optional().describe('Comma-separated label names'),
      assignee: z.string().optional(),
    },
  },
  async ({ project, state, labels, assignee }) => {
    const args = [
      'issue',
      'list',
      '-R',
      project,
      '--output',
      'json',
      '-P',
      '100',
    ];
    if (state === 'closed') args.push('--closed');
    if (state === 'all') args.push('--all'); // glab flag to include all
    if (labels) args.push('--label', labels);
    if (assignee) args.push('--assignee', assignee);

    let page = 1;
    const all: unknown[] = [];
    while (true) {
      const pageArgs = [...args, '--page', String(page)];
      const chunk = await runGlabJson(pageArgs);
      if (Array.isArray(chunk)) {
        all.push(...chunk);
        if (chunk.length < 100) break;
        page++;
      } else break;
    }

    return { content: [{ type: 'text', text: JSON.stringify(all, null, 2) }] };
  }
);

/**
 * Tool: gitlab.mrs.list
 * Wraps `glab mr list` with JSON output.
 */
server.registerTool(
  'gitlab_mrs_list',
  {
    title: 'List merge requests',
    description: 'List MRs for a project using glab mr list',
    inputSchema: {
      project: z.string(),
      state: z.enum(['opened', 'merged', 'closed', 'all']).default('opened'),
      labels: z.string().optional(),
      draft: z.boolean().optional(),
    },
  },
  async ({ project, state, labels, draft }) => {
    const args = ['mr', 'list', '-R', project, '--output', 'json', '-P', '100'];
    if (state !== 'opened') args.push('--state', state);
    if (labels) args.push('--label', labels);
    if (draft === true) args.push('--draft');
    const data = await runGlabJson(args);
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

/**
 * Tool: gitlab.mr.create
 * Create merge requests via GitLab REST API (avoids git repository dependency).
 */
server.registerTool(
  'gitlab_mr_create',
  {
    title: 'Create a merge request',
    description: 'Create an MR using GitLab REST API via glab api',
    inputSchema: {
      project: z.string(),
      sourceBranch: z.string(),
      targetBranch: z.string(),
      title: z.string(),
      description: z.string().default(''),
      draft: z.boolean().default(false),
      labels: z.string().optional(),
      assignees: z.string().optional(),
    },
  },
  async ({
    project,
    sourceBranch,
    targetBranch,
    title,
    description,
    draft,
    labels,
    assignees,
  }) => {
    const id = projectIdOrEncodedPath(project);
    const path = `projects/${id}/merge_requests`;

    const fields: Record<string, any> = {
      source_branch: sourceBranch,
      target_branch: targetBranch,
      title: title,
    };

    if (description) fields.description = description;
    if (draft) fields.title = `Draft: ${title}`;
    if (labels) fields.labels = labels;
    if (assignees)
      fields.assignee_ids = assignees.split(',').map((a) => a.trim());

    const data = await runGlabJson([
      'api',
      '--method',
      'POST',
      path,
      ...Object.entries(fields).flatMap(([k, v]) => [
        '-F',
        `${k}=${typeof v === 'string' ? v : JSON.stringify(v)}`,
      ]),
    ]);

    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    };
  }
);

/**
 * Tool: gitlab.pipelines.list
 * Uses REST via `glab api` for consistent JSON.
 */
server.registerTool(
  'gitlab_pipelines_list',
  {
    title: 'List pipelines',
    description:
      'List pipelines for a project using GitLab REST via `glab api`',
    inputSchema: {
      project: z.string(),
      page: z.number().int().min(1).default(1),
      perPage: z.number().int().min(1).max(100).default(50),
      status: z.string().optional(),
    },
  },
  async ({ project, page, perPage, status }) => {
    const id = projectIdOrEncodedPath(project);
    const path =
      `projects/${id}/pipelines?per_page=${perPage}&page=${page}` +
      (status ? `&status=${encodeURIComponent(status)}` : '');
    const data = await runGlabJson(['api', '--method', 'GET', path]);
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

/**
 * Tool: gitlab.api
 * Low-level escape hatch to call any GitLab REST endpoint through `glab api`.
 */
server.registerTool(
  'gitlab_api',
  {
    title: 'Raw GitLab API via glab',
    description:
      'Call GitLab REST endpoints with glab api (method, path, fields, headers)',
    inputSchema: {
      method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).default('GET'),
      path: z
        .string()
        .describe(
          "Path below /api/v4, e.g. 'projects/:id/issues' where :id is numeric or URL-encoded path"
        ),
      fields: z.record(z.any()).optional(),
      headers: z.record(z.string()).optional(),
    },
  },
  async ({ method, path, fields, headers }) => {
    const args = ['api', '--method', method, path];
    if (headers)
      for (const [k, v] of Object.entries(headers))
        args.push('-H', `${k}: ${v}`);
    if (fields)
      for (const [k, v] of Object.entries(fields))
        args.push(
          '-F',
          `${k}=${typeof v === 'string' ? v : JSON.stringify(v)}`
        );
    const data = await runGlabJson(args);
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

// Entrypoint
async function main() {
  if (process.argv.includes('--self-test')) {
    const ver = await runGlab(['--version']);
    console.error('glab:', ver.out.trim());
    process.exit(0);
  }
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
