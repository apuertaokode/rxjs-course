import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Course } from "../model/course";
import {
  distinctUntilChanged,
  startWith,
  map,
  switchMap,
  throttleTime,
} from "rxjs/operators";
import { merge, fromEvent, Observable, concat, interval } from "rxjs";
import { Lesson } from "../model/lesson";
import { createHttpObservable } from "../common/util";
import { debug, RxJsLoggingLevel } from "../common/debug";

@Component({
  selector: "course",
  templateUrl: "./course.component.html",
  styleUrls: ["./course.component.css"],
})
export class CourseComponent implements OnInit, AfterViewInit {
  courseId: string;
  course$: Observable<Course>;
  lessons$: Observable<Lesson[]>;

  @ViewChild("searchInput", { static: true }) input: ElementRef;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.courseId = this.route.snapshot.params["id"];

    this.course$ = (
      createHttpObservable(`api/courses/${this.courseId}`) as Observable<Course>
    ).pipe(debug(RxJsLoggingLevel.INFO, "course value"));
  }

  ngAfterViewInit() {
    this.lessons$ = fromEvent<any>(this.input.nativeElement, "keyup").pipe(
      map((event) => event.target.value),
      startWith(""),
      debug(RxJsLoggingLevel.TRACE, "search"),
      throttleTime(500),
      distinctUntilChanged(),
      switchMap((search) => this.loadLessons(search)),
      debug(RxJsLoggingLevel.DEBUD, "lessons value")
    );
  }

  loadLessons(search = ""): Observable<Lesson[]> {
    return createHttpObservable(
      `api/lessons?courseId=${this.courseId}&pageSize=100&filter=${search}`
    ).pipe(map((res) => res["payload"]));
  }
}
